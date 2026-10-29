import { DSAProblem } from "../types";

export const TREE_PROBLEMS: DSAProblem[] = [
  {
    id: "dsa_tree_001",
    slug: "invert-binary-tree",
    title: "Invert Binary Tree",
    difficulty: "easy",
    primaryTopic: "binary-trees",
    secondaryTopics: ["recursion", "binary-search-trees"],
    statement: `Given the root of a binary tree, invert the tree (swap left and right child pointers at every node), and return its serialized level-order traversal.`,
    inputFormat: "A single line of space-separated integers representing the binary tree in level order (use 'null' or '-1' for missing nodes).",
    outputFormat: "Print the inverted binary tree in level order space-separated format.",
    constraints: [
      "The number of nodes in the tree is in the range [0, 100].",
      "-100 <= Node.val <= 100",
    ],
    examples: [
      {
        input: "4 2 7 1 3 6 9",
        output: "4 7 2 9 6 3 1",
        explanation: "Every node's left and right children are mirrored.",
      },
      {
        input: "2 1 3",
        output: "2 3 1",
        explanation: "The children 1 and 3 are swapped.",
      },
    ],
    starterCode: {
      python: `import sys
from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def invert_tree(root):
    if not root: return None
    root.left, root.right = invert_tree(root.right), invert_tree(root.left)
    return root

def solve():
    line = sys.stdin.read().strip()
    if not line: return
    vals = line.split()
    if not vals or vals[0] in ('null', '-1'): return
    
    root = TreeNode(int(vals[0]))
    queue = deque([root])
    i = 1
    while queue and i < len(vals):
        curr = queue.popleft()
        if i < len(vals) and vals[i] not in ('null', '-1'):
            curr.left = TreeNode(int(vals[i]))
            queue.append(curr.left)
        i += 1
        if i < len(vals) and vals[i] not in ('null', '-1'):
            curr.right = TreeNode(int(vals[i]))
            queue.append(curr.right)
        i += 1
        
    invert_tree(root)
    
    out = []
    q = deque([root])
    while q:
        node = q.popleft()
        out.append(str(node.val))
        if node.left: q.append(node.left)
        if node.right: q.append(node.right)
    print(" ".join(out))

if __name__ == "__main__":
    solve()
`,
    },
    publicTestCases: [
      { input: "4 2 7 1 3 6 9", expectedOutput: "4 7 2 9 6 3 1", isPublic: true },
      { input: "2 1 3", expectedOutput: "2 3 1", isPublic: true },
    ],
    hiddenTestCases: [
      { input: "1", expectedOutput: "1", isPublic: false },
      { input: "1 2 null", expectedOutput: "1 null 2", isPublic: false },
      { input: "5 3 8 1 4", expectedOutput: "5 8 3 null null 4 1", isPublic: false },
    ],
    referenceSolution: {
      python: `import sys
from collections import deque
class T:
    def __init__(self, v): self.v, self.l, self.r = v, None, None
def inv(r):
    if not r: return None
    r.l, r.r = inv(r.r), inv(r.l)
    return r
s = sys.stdin.read().strip().split()
if s and s[0] != 'null':
    root = T(s[0])
    q = deque([root])
    i = 1
    while q and i < len(s):
        c = q.popleft()
        if i < len(s) and s[i] != 'null': c.l = T(s[i]); q.append(c.l)
        i += 1
        if i < len(s) and s[i] != 'null': c.r = T(s[i]); q.append(c.r)
        i += 1
    inv(root)
    out = []
    q = deque([root])
    while q:
        n = q.popleft()
        out.append(n.v)
        if n.l: q.append(n.l)
        if n.r: q.append(n.r)
    print(" ".join(out))`,
    },
    referenceSolutionLanguage: "python",
    expectedTimeComplexity: "O(n)",
    expectedSpaceComplexity: "O(h)",
    requiredConcepts: ["Recursion", "Binary Tree Traversal"],
    prerequisiteConcepts: ["Binary Trees"],
    hints: [
      {
        level: 1,
        title: "Gentle Nudge",
        hint: "To invert a tree, swap the left and right child subtrees of every single node in the hierarchy.",
      },
      {
        level: 2,
        title: "Algorithmic Direction",
        hint: "Base case: if root is null, return null. Otherwise recursively invert left and right, then swap root.left and root.right.",
      },
      {
        level: 3,
        title: "Detailed Guidance",
        hint: "root.left, root.right = invertTree(root.right), invertTree(root.left). Return root.",
      },
    ],
    editorial: {
      mainIdea: "Inversion is a recursive mirror operation on each sub-tree.",
      approach: "Perform a post-order traversal, recursively inverting subtrees before swapping pointers at the parent node.",
      complexityExplanation: "Each of the n nodes is visited once, yielding O(n) runtime and O(h) call stack memory where h is tree height.",
      timeComplexity: "O(n)",
      spaceComplexity: "O(h)",
    },
    tags: ["binary-trees", "recursion"],
    isPublished: true,
    orderIndex: 8,
  },
];
