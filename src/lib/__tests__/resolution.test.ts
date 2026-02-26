import { checkVoteResolution } from "../resolution";

const yes = { vote: "yes" as const };
const no = { vote: "no" as const };

/** Returns an ISO timestamp N hours in the past. */
const hoursAgo = (h: number) =>
  new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

/** Returns the current time as an ISO string (voting just opened). */
const justNow = () => new Date().toISOString();

describe("checkVoteResolution — early resolve (< 48 hours)", () => {
  it("resolves yes when >50% participated and majority voted yes", () => {
    // 3/4 participants voted; yes wins 3–0
    const result = checkVoteResolution([yes, yes, yes], 4, justNow());
    expect(result.shouldResolve).toBe(true);
    expect(result.outcome).toBe("yes");
    expect(result.cancelled).toBe(false);
  });

  it("resolves no when >50% participated and majority voted no", () => {
    const result = checkVoteResolution([no, no, no], 4, justNow());
    expect(result.shouldResolve).toBe(true);
    expect(result.outcome).toBe("no");
    expect(result.cancelled).toBe(false);
  });

  it("does NOT resolve early when exactly 50% participated", () => {
    // 2/4 = 50%, not > 50%
    const result = checkVoteResolution([yes, yes], 4, justNow());
    expect(result.shouldResolve).toBe(false);
  });

  it("does NOT resolve early when >50% participated but votes are tied", () => {
    // 4/4 = 100%, but 2 yes / 2 no
    const result = checkVoteResolution([yes, yes, no, no], 4, justNow());
    expect(result.shouldResolve).toBe(false);
  });

  it("does NOT resolve with zero votes", () => {
    const result = checkVoteResolution([], 4, justNow());
    expect(result.shouldResolve).toBe(false);
  });
});

describe("checkVoteResolution — 48-hour fallback", () => {
  it("resolves yes after 48 h with plurality yes", () => {
    const result = checkVoteResolution([yes, yes, no], 10, hoursAgo(49));
    expect(result.shouldResolve).toBe(true);
    expect(result.outcome).toBe("yes");
    expect(result.cancelled).toBe(false);
  });

  it("resolves no after 48 h with plurality no", () => {
    const result = checkVoteResolution([no, no, yes], 10, hoursAgo(49));
    expect(result.shouldResolve).toBe(true);
    expect(result.outcome).toBe("no");
    expect(result.cancelled).toBe(false);
  });

  it("cancels on exact tie after 48 h", () => {
    const result = checkVoteResolution([yes, no], 4, hoursAgo(49));
    expect(result.shouldResolve).toBe(true);
    expect(result.outcome).toBeNull();
    expect(result.cancelled).toBe(true);
  });

  it("resolves with a single yes vote after 48 h (low participation is fine)", () => {
    const result = checkVoteResolution([yes], 10, hoursAgo(49));
    expect(result.shouldResolve).toBe(true);
    expect(result.outcome).toBe("yes");
    expect(result.cancelled).toBe(false);
  });

  it("does NOT resolve when only 47 h have elapsed", () => {
    // 47 h < 48 h, and participation is ≤ 50%, so neither rule fires
    const result = checkVoteResolution([yes], 10, hoursAgo(47));
    expect(result.shouldResolve).toBe(false);
  });
});

describe("checkVoteResolution — vote tallies in result", () => {
  it("returns accurate yes/no counts", () => {
    const result = checkVoteResolution([yes, yes, no], 5, justNow());
    expect(result.yesVotes).toBe(2);
    expect(result.noVotes).toBe(1);
    expect(result.totalVotes).toBe(3);
    expect(result.totalParticipants).toBe(5);
  });
});
