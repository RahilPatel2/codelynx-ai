import { DSAProblem } from "../types";

export const DP_PROBLEMS: DSAProblem[] = [
  {
    id: "dsa_dp_001",
    slug: "climbing-stairs-ways",
    title: "Climbing Stairs Combinations",
    difficulty: "easy",
    primaryTopic: "dynamic-programming",
    secondaryTopics: ["memoization", "tabulation"],
    statement: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?`,
    inputFormat: "A single integer n.",
    outputFormat: "Print the total number of distinct ways.",
    constraints: ["1 <= n <= 45"],
    examples: [
      {
        input: "2",
        output: "2",
        explanation: "There are two ways: 1. (1 step + 1 step), 2. (2 steps).",
      },
      {
        input: "3",
        output: "3",
        explanation: "There are three ways: 1. (1 + 1 + 1), 2. (1 + 2), 3. (2 + 1).",
      },
    ],
    starterCode: {
      python: `import sys

def climb_stairs():
    line = sys.stdin.read().strip()
    if not line: return
    n = int(line)
    
    if n <= 2:
        print(n)
        return
        
    prev2, prev1 = 1, 2
    for _ in range(3, n + 1):
        prev2, prev1 = prev1, prev2 + prev1
    print(prev1)

if __name__ == "__main__":
    climb_stairs()
`,
      cpp: `#include <iostream>

using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    if (n <= 2) {
        cout << n << endl;
        return 0;
    }
    long long a = 1, b = 2;
    for (int i = 3; i <= n; ++i) {
        long long c = a + b;
        a = b;
        b = c;
    }
    cout << b << endl;
    return 0;
}
`,
    },
    publicTestCases: [
      { input: "2", expectedOutput: "2", isPublic: true },
      { input: "3", expectedOutput: "3", isPublic: true },
      { input: "4", expectedOutput: "5", isPublic: true },
    ],
    hiddenTestCases: [
      { input: "1", expectedOutput: "1", isPublic: false },
      { input: "5", expectedOutput: "8", isPublic: false },
      { input: "10", expectedOutput: "89", isPublic: false },
      { input: "20", expectedOutput: "10946", isPublic: false },
    ],
    referenceSolution: {
      python: `import sys
n = int(sys.stdin.read().strip())
if n <= 2:
    print(n)
else:
    a, b = 1, 2
    for _ in range(3, n + 1):
        a, b = b, a + b
    print(b)`,
    },
    referenceSolutionLanguage: "python",
    expectedTimeComplexity: "O(n)",
    expectedSpaceComplexity: "O(1)",
    requiredConcepts: ["Fibonacci Sequence", "State Transitions"],
    prerequisiteConcepts: ["Recursion", "Dynamic Programming"],
    hints: [
      {
        level: 1,
        title: "Gentle Nudge",
        hint: "To reach step n, you must have come from either step n - 1 or step n - 2.",
      },
      {
        level: 2,
        title: "Algorithmic Direction",
        hint: "The recurrence is ways(n) = ways(n - 1) + ways(n - 2), which is the standard Fibonacci relation.",
      },
      {
        level: 3,
        title: "Detailed Guidance",
        hint: "Instead of an O(n) array, keep two rolling variables a = 1 and b = 2. Update a, b = b, a + b for each step from 3 to n.",
      },
    ],
    editorial: {
      mainIdea: "Any path to step n arrives either with a 1-step leap from n - 1 or a 2-step leap from n - 2.",
      approach: "Compute the number of paths iteratively from base cases dp[1] = 1 and dp[2] = 2 using rolling state variables.",
      complexityExplanation: "Iterating n - 2 times takes O(n) time with O(1) space using two temporary variables.",
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
    },
    tags: ["dynamic-programming", "tabulation"],
    isPublished: true,
    orderIndex: 6,
  },
  {
    id: "dsa_dp_002",
    slug: "coin-change-minimum-coins",
    title: "Coin Change Minimum Denominations",
    difficulty: "medium",
    primaryTopic: "dynamic-programming",
    secondaryTopics: ["tabulation", "breadth-first-search"],
    statement: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the **fewest number of coins** that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.`,
    inputFormat: "First line contains the integer amount. Second line contains space-separated integers representing coin denominations.",
    outputFormat: "Print the minimum number of coins, or -1 if impossible.",
    constraints: [
      "1 <= coins.length <= 12",
      "1 <= coins[i] <= 2^31 - 1",
      "0 <= amount <= 10^4",
    ],
    examples: [
      {
        input: "11\n1 2 5",
        output: "3",
        explanation: "11 = 5 + 5 + 1 (3 coins).",
      },
      {
        input: "3\n2",
        output: "-1",
        explanation: "3 cannot be formed using only coins of 2.",
      },
      {
        input: "0\n1",
        output: "0",
        explanation: "0 amount requires 0 coins.",
      },
    ],
    starterCode: {
      python: `import sys

def coin_change():
    lines = sys.stdin.read().strip().split('\\n')
    if not lines or not lines[0]: return
    amount = int(lines[0].strip())
    coins = list(map(int, lines[1].strip().split()))
    
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    
    for a in range(1, amount + 1):
        for c in coins:
            if a >= c:
                dp[a] = min(dp[a], dp[a - c] + 1)
                
    ans = dp[amount]
    print(ans if ans != float('inf') else -1)

if __name__ == "__main__":
    coin_change()
`,
    },
    publicTestCases: [
      { input: "11\n1 2 5", expectedOutput: "3", isPublic: true },
      { input: "3\n2", expectedOutput: "-1", isPublic: true },
      { input: "0\n1", expectedOutput: "0", isPublic: true },
    ],
    hiddenTestCases: [
      { input: "6249\n186 419 83 408", expectedOutput: "20", isPublic: false },
      { input: "7\n2 4", expectedOutput: "-1", isPublic: false },
      { input: "100\n1 5 10 25", expectedOutput: "4", isPublic: false },
    ],
    referenceSolution: {
      python: `import sys
lines = sys.stdin.read().strip().split('\\n')
amt = int(lines[0].strip())
coins = list(map(int, lines[1].strip().split()))
dp = [float('inf')] * (amt + 1)
dp[0] = 0
for a in range(1, amt + 1):
    for c in coins:
        if a >= c:
            dp[a] = min(dp[a], dp[a - c] + 1)
print(dp[amt] if dp[amt] != float('inf') else -1)`,
    },
    referenceSolutionLanguage: "python",
    expectedTimeComplexity: "O(amount * n)",
    expectedSpaceComplexity: "O(amount)",
    requiredConcepts: ["Unbounded Knapsack", "Dynamic Programming"],
    prerequisiteConcepts: ["Dynamic Programming"],
    hints: [
      {
        level: 1,
        title: "Gentle Nudge",
        hint: "A greedy approach picking the largest coin fails (e.g. amount = 6 with coins [1, 3, 4] -> greedy gives 4 + 1 + 1 = 3 coins, but 3 + 3 = 2 coins is optimal).",
      },
      {
        level: 2,
        title: "Algorithmic Direction",
        hint: "Define dp[i] as the minimum coins needed for sub-amount i. Transition: dp[i] = min(dp[i], dp[i - coin] + 1).",
      },
      {
        level: 3,
        title: "Detailed Guidance",
        hint: "Initialize array dp of size amount + 1 with infinity, and dp[0] = 0. Iterate i from 1 to amount, and for each coin, update dp[i] = min(dp[i], dp[i - coin] + 1).",
      },
    ],
    editorial: {
      mainIdea: "Model as an unbounded knapsack problem where each denomination can be used unlimited times.",
      approach: "Bottom-up tabulation computes the minimum coin cost for all amounts up to target amount.",
      complexityExplanation: "There are amount subproblems, and for each we iterate through n coins, yielding O(amount * n) time and O(amount) space.",
      timeComplexity: "O(amount * n)",
      spaceComplexity: "O(amount)",
    },
    tags: ["dynamic-programming", "tabulation"],
    isPublished: true,
    orderIndex: 7,
  },
];
