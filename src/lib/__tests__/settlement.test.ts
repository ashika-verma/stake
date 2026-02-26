import {
  calculateBalances,
  simplifyDebts,
  calculateSettlement,
  createCancelledSettlement,
} from "../settlement";

const mkParticipant = (
  userId: string,
  prediction: "yes" | "no",
  pledgeAmount: number,
  venmoUsername: string | null = null
) => ({ userId, displayName: userId, venmoUsername, prediction, pledgeAmount });

describe("calculateBalances", () => {
  it("winner takes all with one winner and one loser", () => {
    const parts = [mkParticipant("alice", "yes", 10), mkParticipant("bob", "no", 10)];
    const balances = calculateBalances(parts, "yes");

    const alice = balances.find((b) => b.userId === "alice")!;
    const bob = balances.find((b) => b.userId === "bob")!;

    expect(alice.net).toBeCloseTo(10);   // wins bob's $10
    expect(bob.net).toBeCloseTo(-10);    // loses $10
  });

  it("multiple winners split pool proportionally", () => {
    // alice2 bets $10 yes, alice bets $10 yes, bob bets $10 no → each winner gets $5
    const parts = [
      mkParticipant("alice", "yes", 10),
      mkParticipant("alice2", "yes", 10),
      mkParticipant("bob", "no", 10),
    ];
    const balances = calculateBalances(parts, "yes");

    const alice = balances.find((b) => b.userId === "alice")!;
    const alice2 = balances.find((b) => b.userId === "alice2")!;

    expect(alice.net).toBeCloseTo(5);
    expect(alice2.net).toBeCloseTo(5);
  });

  it("all winners (no losers) → zero net for everyone", () => {
    const parts = [mkParticipant("alice", "yes", 10), mkParticipant("carol", "yes", 20)];
    const balances = calculateBalances(parts, "yes");

    expect(balances.every((b) => b.net === 0)).toBe(true);
  });

  it("asymmetric stakes: winner gets full losing pool proportionally", () => {
    // alice bets $20 yes, bob bets $10 no — alice wins $10
    const parts = [mkParticipant("alice", "yes", 20), mkParticipant("bob", "no", 10)];
    const balances = calculateBalances(parts, "yes");

    const alice = balances.find((b) => b.userId === "alice")!;
    const bob = balances.find((b) => b.userId === "bob")!;

    expect(alice.net).toBeCloseTo(10);
    expect(bob.net).toBeCloseTo(-10);
  });
});

describe("simplifyDebts", () => {
  it("produces minimal transactions for multi-person debt", () => {
    // A is owed $10, B owes $5, C owes $5 → 2 transactions
    const balances = [
      { userId: "A", displayName: "A", venmoUsername: null, net: 10 },
      { userId: "B", displayName: "B", venmoUsername: null, net: -5 },
      { userId: "C", displayName: "C", venmoUsername: null, net: -5 },
    ];
    const txns = simplifyDebts(balances, "Test Bet");

    expect(txns).toHaveLength(2);
    expect(txns.reduce((s, t) => s + t.amount, 0)).toBeCloseTo(10);
    expect(txns.every((t) => t.toUserId === "A")).toBe(true);
  });

  it("filters out dust amounts (< $0.005)", () => {
    const balances = [
      { userId: "A", displayName: "A", venmoUsername: null, net: 0.001 },
      { userId: "B", displayName: "B", venmoUsername: null, net: -0.001 },
    ];
    expect(simplifyDebts(balances, "Dust")).toHaveLength(0);
  });

  it("returns empty array when all balances are zero", () => {
    const balances = [
      { userId: "A", displayName: "A", venmoUsername: null, net: 0 },
      { userId: "B", displayName: "B", venmoUsername: null, net: 0 },
    ];
    expect(simplifyDebts(balances, "Zero")).toHaveLength(0);
  });
});

describe("calculateSettlement", () => {
  it("produces correct settlement pools and single transaction", () => {
    const parts = [
      mkParticipant("alice", "yes", 10),
      mkParticipant("bob", "no", 10),
    ];
    const settlement = calculateSettlement("bet-1", "Will it rain?", parts, "yes");

    expect(settlement.totalPool).toBe(20);
    expect(settlement.winningPool).toBe(10);
    expect(settlement.losingPool).toBe(10);
    expect(settlement.outcome).toBe("yes");
    expect(settlement.transactions).toHaveLength(1);

    const txn = settlement.transactions[0];
    expect(txn.fromUserId).toBe("bob");
    expect(txn.toUserId).toBe("alice");
    expect(txn.amount).toBeCloseTo(10);
  });

  it("all winners produce no debt transactions", () => {
    const parts = [mkParticipant("alice", "yes", 10), mkParticipant("bob", "yes", 10)];
    const settlement = calculateSettlement("bet-2", "Everyone wins", parts, "yes");

    expect(settlement.transactions).toHaveLength(0);
    expect(settlement.losingPool).toBe(0);
  });
});

describe("createCancelledSettlement", () => {
  it("returns empty settlement with null outcome", () => {
    const settlement = createCancelledSettlement("bet-99", "Cancelled Bet");

    expect(settlement.outcome).toBeNull();
    expect(settlement.transactions).toHaveLength(0);
    expect(settlement.balances).toHaveLength(0);
    expect(settlement.totalPool).toBe(0);
    expect(settlement.winningPool).toBe(0);
    expect(settlement.losingPool).toBe(0);
  });
});
