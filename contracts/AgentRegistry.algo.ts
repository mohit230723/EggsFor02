import { Contract } from '@algorandfoundation/tealscript';

// Agent metadata stored in a box keyed by agent wallet address
type AgentRecord = {
  owner: Address;                        // Human wallet that deployed this agent
  agentAddress: Address;                 // Agent's own Algorand wallet address
  name: StaticArray<byte, 32>;           // Agent name
  eggsLevel: uint64;                     // Progression level (earned from wins)
  equippedSkill1: uint64;               // Skill ID from SkillMarketplace (0 = none)
  equippedSkill2: uint64;
  equippedSkill3: uint64;
  matchWins: uint64;
  matchLosses: uint64;
  createdAt: uint64;
  active: uint64;                        // 1 = active, 0 = deactivated
};

// Match record stored in a box keyed by matchId
type MatchRecord = {
  matchId: uint64;
  gameType: uint64;                      // 1 = RPS, 2 = TicTacToe, 3 = Nim
  agentA: Address;
  agentB: Address;
  stakeAmount: uint64;                   // in microALGO
  commitHashA: StaticArray<byte, 32>;    // sha256(move + salt)
  commitHashB: StaticArray<byte, 32>;
  revealedMoveA: uint64;                 // 0 = unrevealed
  revealedMoveB: uint64;
  winner: Address;                       // zero address = no winner yet
  status: uint64;                        // 0=open, 1=committed, 2=revealed, 3=settled
  createdAt: uint64;
};

export class AgentRegistry extends Contract {
  // Global state
  agentCount = GlobalStateKey<uint64>({ key: 'ac' });
  matchCount = GlobalStateKey<uint64>({ key: 'mc' });
  admin = GlobalStateKey<Address>({ key: 'ad' });
  deployFee = GlobalStateKey<uint64>({ key: 'df' }); // microALGO fee to deploy
  skillMarketAppId = GlobalStateKey<uint64>({ key: 'sm' }); // cross-app reference

  // Box maps
  agents = BoxMap<Address, AgentRecord>({ prefix: 'agt_' });
  agentsByOwner = BoxMap<string, Address>({ prefix: 'own_' });
  ownerAgentCount = BoxMap<Address, uint64>({ prefix: 'cnt_' });
  matches = BoxMap<uint64, MatchRecord>({ prefix: 'mat_' });

  createApplication(deployFee: uint64, skillMarketAppId: uint64): void {
    this.agentCount.value = 0;
    this.matchCount.value = 0;
    this.admin.value = this.txn.sender;
    this.deployFee.value = deployFee;
    this.skillMarketAppId.value = skillMarketAppId;
  }

  /**
   * Register a new agent on-chain.
   * The agent wallet must already exist on-chain.
   * Requires a deploy fee payment + MBR for box storage.
   */
  registerAgent(
    deployPayment: PayTxn,
    agentAddress: Address,
    name: StaticArray<byte, 32>,
  ): void {
    // Verify fee covers deploy cost + box MBR
    const boxSize = 200; // approximate AgentRecord size
    const minPayment = this.deployFee.value + 2500 + boxSize * 400;
    verifyPayTxn(deployPayment, {
      receiver: this.app.address,
      amount: { greaterThanEqualTo: minPayment },
    });

    assert(!this.agents(agentAddress).exists, 'Agent already registered');

    const record: AgentRecord = {
      owner: this.txn.sender,
      agentAddress: agentAddress,
      name: name,
      eggsLevel: 0,
      equippedSkill1: 0,
      equippedSkill2: 0,
      equippedSkill3: 0,
      matchWins: 0,
      matchLosses: 0,
      createdAt: globals.round,
      active: 1,
    };

    this.agents(agentAddress).value = record;

    // Track agent by owner for lookup
    const ownerCount = this.ownerAgentCount(this.txn.sender).exists
      ? this.ownerAgentCount(this.txn.sender).value
      : 0;
    const ownerKey = rawBytes(this.txn.sender) + '_' + itob(ownerCount);
    this.agentsByOwner(ownerKey).value = agentAddress;
    this.ownerAgentCount(this.txn.sender).value = ownerCount + 1;

    this.agentCount.value = this.agentCount.value + 1;
  }

  /**
   * Equip skills onto an agent. Only owner can call this.
   * Skill IDs must be valid purchases in the SkillMarketplace.
   */
  equipSkills(
    agentAddress: Address,
    skill1: uint64,
    skill2: uint64,
    skill3: uint64,
  ): void {
    assert(this.agents(agentAddress).exists, 'Agent not found');
    const agent = this.agents(agentAddress).value;
    assert(this.txn.sender === agent.owner, 'Not your agent');
    assert(agent.active === 1, 'Agent is deactivated');

    const updated: AgentRecord = {
      owner: agent.owner,
      agentAddress: agent.agentAddress,
      name: agent.name,
      eggsLevel: agent.eggsLevel,
      equippedSkill1: skill1,
      equippedSkill2: skill2,
      equippedSkill3: skill3,
      matchWins: agent.matchWins,
      matchLosses: agent.matchLosses,
      createdAt: agent.createdAt,
      active: agent.active,
    };
    this.agents(agentAddress).value = updated;
  }

  /**
   * Create a match. Agent A initiates and locks their stake.
   */
  createMatch(
    stakePayment: PayTxn,
    agentA: Address,
    gameType: uint64,
    commitHashA: StaticArray<byte, 32>,
  ): uint64 {
    assert(this.agents(agentA).exists, 'Agent A not found');
    const agent = this.agents(agentA).value;
    assert(this.txn.sender === agent.owner, 'Not your agent');

    verifyPayTxn(stakePayment, {
      receiver: this.app.address,
      amount: { greaterThanEqualTo: 1_000_000 }, // min 1 ALGO stake
    });

    const matchId = this.matchCount.value + 1;
    this.matchCount.value = matchId;

    const zeroAddr = globals.zeroAddress;
    const zeroHash = <StaticArray<byte, 32>>bzero(32);

    const match: MatchRecord = {
      matchId: matchId,
      gameType: gameType,
      agentA: agentA,
      agentB: zeroAddr,
      stakeAmount: stakePayment.amount,
      commitHashA: commitHashA,
      commitHashB: zeroHash,
      revealedMoveA: 0,
      revealedMoveB: 0,
      winner: zeroAddr,
      status: 0, // open
      createdAt: globals.round,
    };
    this.matches(matchId).value = match;

    return matchId;
  }

  /**
   * Agent B joins an open match and commits their move hash.
   */
  joinMatch(
    stakePayment: PayTxn,
    matchId: uint64,
    agentB: Address,
    commitHashB: StaticArray<byte, 32>,
  ): void {
    assert(this.matches(matchId).exists, 'Match not found');
    const match = this.matches(matchId).value;
    assert(match.status === 0, 'Match not open');
    assert(this.agents(agentB).exists, 'Agent B not found');
    const agentBRecord = this.agents(agentB).value;
    assert(this.txn.sender === agentBRecord.owner, 'Not your agent');
    assert(agentB !== match.agentA, 'Cannot fight yourself');

    verifyPayTxn(stakePayment, {
      receiver: this.app.address,
      amount: { greaterThanEqualTo: match.stakeAmount },
    });

    const updated: MatchRecord = {
      matchId: match.matchId,
      gameType: match.gameType,
      agentA: match.agentA,
      agentB: agentB,
      stakeAmount: match.stakeAmount,
      commitHashA: match.commitHashA,
      commitHashB: commitHashB,
      revealedMoveA: match.revealedMoveA,
      revealedMoveB: match.revealedMoveB,
      winner: match.winner,
      status: 1, // committed
      createdAt: match.createdAt,
    };
    this.matches(matchId).value = updated;
  }

  /**
   * Settle a match after both moves are revealed.
   * Anyone can call this with the revealed moves + salts.
   * Contract verifies hashes then determines the winner.
   */
  settleMatch(
    matchId: uint64,
    moveA: uint64,    // 1=Rock/X/1, 2=Paper/O/2, 3=Scissors/skip
    saltA: StaticArray<byte, 32>,
    moveB: uint64,
    saltB: StaticArray<byte, 32>,
  ): Address {
    assert(this.matches(matchId).exists, 'Match not found');
    const match = this.matches(matchId).value;
    assert(match.status === 1, 'Match not in committed state');

    // Verify commit hashes
    const hashA = sha256(itob(moveA) + rawBytes(saltA));
    const hashB = sha256(itob(moveB) + rawBytes(saltB));
    assert(hashA === match.commitHashA, 'Invalid reveal for Agent A');
    assert(hashB === match.commitHashB, 'Invalid reveal for Agent B');

    // Determine winner (RPS: 1=Rock, 2=Paper, 3=Scissors)
    let winner = globals.zeroAddress;
    if (moveA !== moveB) {
      // Rock beats Scissors (1 beats 3), Paper beats Rock (2 beats 1), Scissors beats Paper (3 beats 2)
      const aWins = (moveA === 1 && moveB === 3) || (moveA === 2 && moveB === 1) || (moveA === 3 && moveB === 2);
      winner = aWins ? match.agentA : match.agentB;
    }
    // If draw, no winner — both get refunded

    const prize = match.stakeAmount * 2;

    if (winner !== globals.zeroAddress) {
      // Get winner's owner to send prize
      const winnerRecord = this.agents(winner).value;
      sendPayment({
        receiver: winnerRecord.owner,
        amount: prize,
      });

      // Update winner's stats
      const winnerUpdated: AgentRecord = {
        owner: winnerRecord.owner,
        agentAddress: winnerRecord.agentAddress,
        name: winnerRecord.name,
        eggsLevel: winnerRecord.eggsLevel + 10, // +10 Eggs for a win
        equippedSkill1: winnerRecord.equippedSkill1,
        equippedSkill2: winnerRecord.equippedSkill2,
        equippedSkill3: winnerRecord.equippedSkill3,
        matchWins: winnerRecord.matchWins + 1,
        matchLosses: winnerRecord.matchLosses,
        createdAt: winnerRecord.createdAt,
        active: winnerRecord.active,
      };
      this.agents(winner).value = winnerUpdated;

      // Update loser's stats
      const loser = winner === match.agentA ? match.agentB : match.agentA;
      const loserRecord = this.agents(loser).value;
      const loserUpdated: AgentRecord = {
        owner: loserRecord.owner,
        agentAddress: loserRecord.agentAddress,
        name: loserRecord.name,
        eggsLevel: loserRecord.eggsLevel,
        equippedSkill1: loserRecord.equippedSkill1,
        equippedSkill2: loserRecord.equippedSkill2,
        equippedSkill3: loserRecord.equippedSkill3,
        matchWins: loserRecord.matchWins,
        matchLosses: loserRecord.matchLosses + 1,
        createdAt: loserRecord.createdAt,
        active: loserRecord.active,
      };
      this.agents(loser).value = loserUpdated;
    } else {
      // Draw — refund both stakes
      const agentARecord = this.agents(match.agentA).value;
      const agentBRecord = this.agents(match.agentB).value;
      sendPayment({ receiver: agentARecord.owner, amount: match.stakeAmount });
      sendPayment({ receiver: agentBRecord.owner, amount: match.stakeAmount });
    }

    const settled: MatchRecord = {
      matchId: match.matchId,
      gameType: match.gameType,
      agentA: match.agentA,
      agentB: match.agentB,
      stakeAmount: match.stakeAmount,
      commitHashA: match.commitHashA,
      commitHashB: match.commitHashB,
      revealedMoveA: moveA,
      revealedMoveB: moveB,
      winner: winner,
      status: 3, // settled
      createdAt: match.createdAt,
    };
    this.matches(matchId).value = settled;

    return winner;
  }

  /** Award Eggs to an agent (admin only, for other game types) */
  awardEggs(agentAddress: Address, amount: uint64): void {
    assert(this.txn.sender === this.admin.value, 'Admin only');
    assert(this.agents(agentAddress).exists, 'Agent not found');
    const agent = this.agents(agentAddress).value;
    const updated: AgentRecord = {
      owner: agent.owner,
      agentAddress: agent.agentAddress,
      name: agent.name,
      eggsLevel: agent.eggsLevel + amount,
      equippedSkill1: agent.equippedSkill1,
      equippedSkill2: agent.equippedSkill2,
      equippedSkill3: agent.equippedSkill3,
      matchWins: agent.matchWins,
      matchLosses: agent.matchLosses,
      createdAt: agent.createdAt,
      active: agent.active,
    };
    this.agents(agentAddress).value = updated;
  }

  /** Update deploy fee (admin only) */
  setDeployFee(fee: uint64): void {
    assert(this.txn.sender === this.admin.value, 'Admin only');
    this.deployFee.value = fee;
  }
}
