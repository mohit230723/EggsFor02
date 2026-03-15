import { GameEngine } from "../engine/types";

export interface RPSState {
  round: number;
}

export type RPSMove = "R" | "P" | "S";

export const rpsEngine: GameEngine<RPSState, RPSMove> = {
  name: "Rock Paper Scissors",
  id: "rps",
  getInitialState: () => ({ round: 1 }),
  validateMove: (state, move, playerId) => {
    if (move === "R" || move === "P" || move === "S") return move;
    // Default fallback if invalid
    const random = Math.random();
    if (random < 0.33) return "R";
    if (random < 0.66) return "P";
    return "S";
  },
  computeNextState: (state, p1Move, p2Move) => {
    if (p1Move === p2Move) {
      return { nextState: { round: state.round + 1 }, winner: "draw", reason: `Both chose ${p1Move}. Match drawn.` };
    }

    const p1Wins = 
      (p1Move === "R" && p2Move === "S") ||
      (p1Move === "P" && p2Move === "R") ||
      (p1Move === "S" && p2Move === "P");

    if (p1Wins) {
      return { nextState: { round: state.round + 1 }, winner: "p1", reason: `${p1Move} beats ${p2Move}. P1 Wins.` };
    } else {
      return { nextState: { round: state.round + 1 }, winner: "p2", reason: `${p2Move} beats ${p1Move}. P2 Wins.` };
    }
  }
};
