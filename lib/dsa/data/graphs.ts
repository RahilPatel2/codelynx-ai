import { DSAProblem } from "../types";

export const GRAPH_PROBLEMS: DSAProblem[] = [
  {
    id: "dsa_graph_001",
    slug: "number-of-islands-grid",
    title: "Number of Islands Grid Traversal",
    difficulty: "medium",
    primaryTopic: "graphs",
    secondaryTopics: ["graph-traversal", "matrices", "disjoint-set-union"],
    statement: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return the number of islands.

An **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.`,
    inputFormat: "First line contains two integers m and n. The next m lines contain n space-separated characters ('1' or '0').",
    outputFormat: "Print the total count of distinct islands.",
    constraints: [
      "1 <= m, n <= 300",
      "grid[i][j] is '0' or '1'.",
    ],
    examples: [
      {
        input: "4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0",
        output: "1",
        explanation: "All adjacent 1s form a single connected island.",
      },
      {
        input: "4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1",
        output: "3",
        explanation: "There are 3 separate connected components of land.",
      },
    ],
    starterCode: {
      python: `import sys

def num_islands():
    lines = sys.stdin.read().strip().split('\\n')
    if not lines or not lines[0]: return
    parts = lines[0].strip().split()
    m, n = int(parts[0]), int(parts[1])
    grid = [lines[i + 1].strip().split() for i in range(m)]
    
    def dfs(r, c):
        if r < 0 or r >= m or c < 0 or c >= n or grid[r][c] != '1':
            return
        grid[r][c] = '0'  # Sink the visited land
        dfs(r + 1, c)
        dfs(r - 1, c)
        dfs(r, c + 1)
        dfs(r, c - 1)
        
    count = 0
    for r in range(m):
        for c in range(n):
            if grid[r][c] == '1':
                count += 1
                dfs(r, c)
    print(count)

if __name__ == "__main__":
    num_islands()
`,
    },
    publicTestCases: [
      {
        input: "4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0",
        expectedOutput: "1",
        isPublic: true,
      },
      {
        input: "4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1",
        expectedOutput: "3",
        isPublic: true,
      },
    ],
    hiddenTestCases: [
      {
        input: "1 1\n1",
        expectedOutput: "1",
        isPublic: false,
      },
      {
        input: "1 1\n0",
        expectedOutput: "0",
        isPublic: false,
      },
      {
        input: "3 3\n1 0 1\n0 1 0\n1 0 1",
        expectedOutput: "5",
        isPublic: false,
      },
    ],
    referenceSolution: {
      python: `import sys
lines = sys.stdin.read().strip().split('\\n')
m, n = map(int, lines[0].split())
grid = [lines[i + 1].split() for i in range(m)]
def dfs(r, c):
    if 0 <= r < m and 0 <= c < n and grid[r][c] == '1':
        grid[r][c] = '0'
        dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1)
ans = 0
for r in range(m):
    for c in range(n):
        if grid[r][c] == '1':
            ans += 1
            dfs(r, c)
print(ans)`,
    },
    referenceSolutionLanguage: "python",
    expectedTimeComplexity: "O(m * n)",
    expectedSpaceComplexity: "O(m * n)",
    requiredConcepts: ["Depth-First Search", "Connected Components"],
    prerequisiteConcepts: ["Graphs", "Recursion", "Matrices"],
    hints: [
      {
        level: 1,
        title: "Gentle Nudge",
        hint: "Each island is a connected component of 1s in a 4-directional grid graph.",
      },
      {
        level: 2,
        title: "Algorithmic Direction",
        hint: "When you find an unvisited '1', trigger a BFS or DFS traversal that marks all 4-directionally reachable '1's as visited.",
      },
      {
        level: 3,
        title: "Detailed Guidance",
        hint: "Iterate (r, c). When grid[r][c] == '1', increment island count and call dfs(r, c) which marks grid[r][c] = '0' and recursively sinks neighbors.",
      },
    ],
    editorial: {
      mainIdea: "Count the number of connected components in an undirected grid graph.",
      approach: "Scan every cell. Whenever unvisited land is encountered, initiate a flood-fill DFS or BFS to visit and mark the entire island, preventing duplicate counting.",
      complexityExplanation: "Every cell is evaluated once during the outer loop and visited at most once during traversal, resulting in O(m * n) time and O(m * n) worst-case recursion space.",
      timeComplexity: "O(m * n)",
      spaceComplexity: "O(m * n)",
    },
    tags: ["graphs", "graph-traversal", "matrices"],
    isPublished: true,
    orderIndex: 9,
  },
];
