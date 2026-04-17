import { Contract } from '@algorandfoundation/tealscript';

// Skill metadata stored in a box
type SkillMetadata = {
  name: StaticArray<byte, 64>;
  description: StaticArray<byte, 256>;
  skillType: StaticArray<byte, 16>;   // Logic, Compute, State, Data
  version: StaticArray<byte, 16>;
  price: uint64;
  seller: Address;
  ipcsCid: StaticArray<byte, 64>;     // IPFS CID of encrypted skill file
  soldCount: uint64;
  listedAt: uint64;
  active: uint64;                     // 1 = active, 0 = delisted
};

// Purchase record stored per buyer per skill
type PurchaseRecord = {
  buyer: Address;
  purchasedAt: uint64;
  skillId: uint64;
};

export class SkillMarketplace extends Contract {
  // Global state
  skillCount = GlobalStateKey<uint64>({ key: 'sc' });
  platformFeeBps = GlobalStateKey<uint64>({ key: 'pf' });  // basis points (500 = 5%)
  admin = GlobalStateKey<Address>({ key: 'ad' });

  // Box prefixes are handled globally by BoxMap
  skills = BoxMap<uint64, SkillMetadata>();
  purchases = BoxMap<string, PurchaseRecord>();

  createApplication(): void {
    this.skillCount.value = 0;
    this.platformFeeBps.value = 500; // 5%
    this.admin.value = this.txn.sender;
  }

  /**
   * List a new skill on the marketplace.
   * Requires an MBR payment for box storage.
   */
  listSkill(
    mbrPayment: PayTxn,
    name: StaticArray<byte, 64>,
    description: StaticArray<byte, 256>,
    skillType: StaticArray<byte, 16>,
    version: StaticArray<byte, 16>,
    price: uint64,
    ipcsCid: StaticArray<byte, 64>,
  ): uint64 {
    // Must pay enough for MBR (box costs)
    const boxSize = 480; // approximate size of SkillMetadata
    const minMbr = 2500 + boxSize * 400; // microAlgo
    verifyPayTxn(mbrPayment, {
      receiver: this.app.address,
      amount: { greaterThanEqualTo: minMbr },
    });

    assert(price > 0, 'Price must be greater than 0');
    // @ts-ignore - name is bytes natively
    // assert(name[0] !== 0, 'Name cannot be empty'); // Temporarily removed due to TEALScript extract bug

    const skillId = this.skillCount.value + 1;
    this.skillCount.value = skillId;

    // Store skill in a box
    const skill: SkillMetadata = {
      name: name,
      description: description,
      skillType: skillType,
      version: version,
      price: price,
      seller: this.txn.sender,
      ipcsCid: ipcsCid,
      soldCount: 0,
      listedAt: globals.round,
      active: 1,
    };

    assert(!this.skills(skillId).exists, 'Skill already exists with this ID');

    this.skills(skillId).value = skill;

    return skillId;
  }

  /**
   * Purchase a skill. Splits payment between seller and platform.
   */
  buySkill(
    payment: PayTxn,
    skillId: uint64,
  ): void {
    assert(this.skills(skillId).exists, 'Skill not found');
    const skill = this.skills(skillId).value;
    assert(skill.active === 1, 'Skill is no longer active');
    assert(this.txn.sender !== skill.seller, 'Cannot buy your own skill');

    verifyPayTxn(payment, {
      receiver: this.app.address,
      amount: { greaterThanEqualTo: skill.price },
    });

    // Check not already purchased
    const purchaseKey = itob(skillId) + '_' + rawBytes(this.txn.sender);
    assert(!this.purchases(purchaseKey).exists, 'Already purchased this skill');

    // Calculate fee split
    const platformFee = (skill.price * this.platformFeeBps.value) / 10000;
    const sellerAmount = skill.price - platformFee;

    // Pay seller
    sendPayment({
      receiver: skill.seller,
      amount: sellerAmount,
    });

    // Pay platform (admin)
    if (platformFee > 0) {
      sendPayment({
        receiver: this.admin.value,
        amount: platformFee,
      });
    }

    // Record the purchase
    const record: PurchaseRecord = {
      buyer: this.txn.sender,
      purchasedAt: globals.round,
      skillId: skillId,
    };
    this.purchases(purchaseKey).value = record;

    // Increment sold count
    const updatedSkill: SkillMetadata = {
      name: skill.name,
      description: skill.description,
      skillType: skill.skillType,
      version: skill.version,
      price: skill.price,
      seller: skill.seller,
      ipcsCid: skill.ipcsCid,
      soldCount: skill.soldCount + 1,
      listedAt: skill.listedAt,
      active: skill.active,
    };
    this.skills(skillId).value = updatedSkill;
  }

  /**
   * Check if a buyer has purchased a skill. Used by x402 content gate.
   */
  hasAccess(skillId: uint64, buyer: Address): uint64 {
    const purchaseKey = itob(skillId) + '_' + rawBytes(buyer);
    return this.purchases(purchaseKey).exists ? 1 : 0;
  }

  /**
   * Delist a skill. Only the seller can delist their own skill.
   */
  delistSkill(skillId: uint64): void {
    assert(this.skills(skillId).exists, 'Skill not found');
    const skill = this.skills(skillId).value;
    assert(this.txn.sender === skill.seller || this.txn.sender === this.admin.value, 'Not authorized');

    const updatedSkill: SkillMetadata = {
      name: skill.name,
      description: skill.description,
      skillType: skill.skillType,
      version: skill.version,
      price: skill.price,
      seller: skill.seller,
      ipcsCid: skill.ipcsCid,
      soldCount: skill.soldCount,
      listedAt: skill.listedAt,
      active: 0,
    };
    this.skills(skillId).value = updatedSkill;
  }

  /**
   * Update platform fee (admin only)
   */
  setPlatformFee(feeBps: uint64): void {
    assert(this.txn.sender === this.admin.value, 'Admin only');
    assert(feeBps <= 1000, 'Max fee is 10%');
    this.platformFeeBps.value = feeBps;
  }
}
