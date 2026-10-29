import { DSAProblem } from "../types";

export const ARRAY_PROBLEMS: DSAProblem[] = [
  {
    id: "dsa_arr_001",
    slug: "two-sum-target-pair",
    title: "Two Sum Target Pair",
    difficulty: "easy",
    primaryTopic: "arrays",
    secondaryTopics: ["hashing", "two-pointers"],
    statement: `Given an array of integers \`nums\` and an integer \`target\`, find the indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice. You can return the answer in any order.`,
    inputFormat: "First line contains the target integer. The second line contains space-separated integers representing nums.",
    outputFormat: "Print two space-separated integers representing the 0-based indices.",
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],
    examples: [
      {
        input: "9\n2 7 11 15",
        output: "0 1",
        explanation: "Because nums[0] + nums[1] == 2 + 7 == 9, we return 0 1.",
      },
      {
        input: "6\n3 2 4",
        output: "1 2",
        explanation: "nums[1] + nums[2] == 2 + 4 == 6, so indices 1 2 are returned.",
      },
    ],
    starterCode: {
      python: `import sys

def solve():
    lines = sys.stdin.read().strip().split('\\n')
    if not lines or not lines[0]: return
    target = int(lines[0].strip())
    nums = list(map(int, lines[1].strip().split()))
    
    # Write your solution here
    seen = {}
    for i, num in enumerate(nums):
        comp = target - num
        if comp in seen:
            print(f"{seen[comp]} {i}")
            return
        seen[num] = i

if __name__ == "__main__":
    solve()
`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

int main() {
    int target;
    if (!(cin >> target)) return 0;
    vector<int> nums;
    int val;
    while (cin >> val) nums.push_back(val);
    
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); ++i) {
        int comp = target - nums[i];
        if (seen.find(comp) != seen.end()) {
            cout << seen[comp] << " " << i << endl;
            return 0;
        }
        seen[nums[i]] = i;
    }
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int target = sc.nextInt();
        List<Integer> nums = new ArrayList<>();
        while (sc.hasNextInt()) {
            nums.add(sc.nextInt());
        }
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.size(); i++) {
            int comp = target - nums.get(i);
            if (seen.containsKey(comp)) {
                System.out.println(seen.get(comp) + " " + i);
                return;
            }
            seen.put(nums.get(i), i);
        }
    }
}
`,
      javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    if (!input[0]) return;
    const target = parseInt(input[0].trim());
    const nums = input[1].trim().split(/\\s+/).map(Number);
    
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (seen.has(comp)) {
            console.log(\`\${seen.get(comp)} \${i}\`);
            return;
        }
        seen.set(nums[i], i);
    }
}

solve();
`,
    },
    publicTestCases: [
      { input: "9\n2 7 11 15", expectedOutput: "0 1", isPublic: true },
      { input: "6\n3 2 4", expectedOutput: "1 2", isPublic: true },
      { input: "6\n3 3", expectedOutput: "0 1", isPublic: true },
    ],
    hiddenTestCases: [
      { input: "10\n1 2 3 4 5 5 7", expectedOutput: "4 5", isPublic: false },
      { input: "-8\n-3 -5 1 2", expectedOutput: "0 1", isPublic: false },
      { input: "100\n20 40 30 50 80", expectedOutput: "0 4", isPublic: false },
      { input: "0\n-10 10", expectedOutput: "0 1", isPublic: false },
    ],
    referenceSolution: {
      python: `import sys
def solve():
    lines = sys.stdin.read().strip().split('\\n')
    if not lines or not lines[0]: return
    target = int(lines[0].strip())
    nums = list(map(int, lines[1].strip().split()))
    seen = {}
    for i, num in enumerate(nums):
        comp = target - num
        if comp in seen:
            print(f"{seen[comp]} {i}")
            return
        seen[num] = i
solve()`,
    },
    referenceSolutionLanguage: "python",
    expectedTimeComplexity: "O(n)",
    expectedSpaceComplexity: "O(n)",
    requiredConcepts: ["Hash Map", "Array Iteration"],
    prerequisiteConcepts: ["Basic Arrays"],
    hints: [
      {
        level: 1,
        title: "Gentle Nudge",
        hint: "A brute-force comparison of all pairs takes O(n^2). Can you check if the matching complement exists in constant O(1) time?",
      },
      {
        level: 2,
        title: "Algorithmic Direction",
        hint: "For each element x, its required partner is target - x. Use a hash map to store each number and its index as you iterate.",
      },
      {
        level: 3,
        title: "Detailed Guidance",
        hint: "Initialize an empty hash map. Iterate i from 0 to n - 1. If (target - nums[i]) is already in the map, return [map[target - nums[i]], i]. Otherwise, insert nums[i] -> i.",
      },
    ],
    editorial: {
      mainIdea: "Use a hash map to look up the complement in O(1) time instead of scanning the rest of the array.",
      approach: "In a single pass through nums, calculate complement = target - nums[i]. If complement is in hash map, return its index and i. Otherwise insert nums[i] with index i.",
      complexityExplanation: "We traverse the list containing n elements exactly once. Each lookup in the hash map takes amortized O(1) time, yielding total time O(n) and auxiliary space O(n).",
      timeComplexity: "O(n)",
      spaceComplexity: "O(n)",
    },
    tags: ["arrays", "hashing", "two-pointers"],
    isPublished: true,
    orderIndex: 1,
  },
  {
    id: "dsa_arr_002",
    slug: "maximum-subarray-kadanes",
    title: "Maximum Subarray (Kadane's Algorithm)",
    difficulty: "medium",
    primaryTopic: "arrays",
    secondaryTopics: ["dynamic-programming", "divide-and-conquer"],
    statement: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

A **subarray** is a contiguous non-empty sequence of elements within an array.`,
    inputFormat: "A single line containing space-separated integers representing nums.",
    outputFormat: "Print the maximum subarray sum.",
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4",
    ],
    examples: [
      {
        input: "-2 1 -3 4 -1 2 1 -5 4",
        output: "6",
        explanation: "The subarray [4, -1, 2, 1] has the largest sum 6.",
      },
      {
        input: "1",
        output: "1",
        explanation: "The subarray [1] has the largest sum 1.",
      },
      {
        input: "5 4 -1 7 8",
        output: "23",
        explanation: "The entire array [5, 4, -1, 7, 8] has the largest sum 23.",
      },
    ],
    starterCode: {
      python: `import sys

def max_sub_array():
    input_data = sys.stdin.read().strip()
    if not input_data: return
    nums = list(map(int, input_data.split()))
    
    # Implement Kadane's algorithm here
    max_so_far = nums[0]
    curr_sum = nums[0]
    for x in nums[1:]:
        curr_sum = max(x, curr_sum + x)
        max_so_far = max(max_so_far, curr_sum)
    print(max_so_far)

if __name__ == "__main__":
    max_sub_array()
`,
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    vector<int> nums;
    int val;
    while (cin >> val) nums.push_back(val);
    if (nums.empty()) return 0;
    
    long long max_so_far = nums[0];
    long long curr = nums[0];
    for (size_t i = 1; i < nums.size(); ++i) {
        curr = max((long long)nums[i], curr + nums[i]);
        max_so_far = max(max_so_far, curr);
    }
    cout << max_so_far << endl;
    return 0;
}
`,
    },
    publicTestCases: [
      { input: "-2 1 -3 4 -1 2 1 -5 4", expectedOutput: "6", isPublic: true },
      { input: "1", expectedOutput: "1", isPublic: true },
      { input: "5 4 -1 7 8", expectedOutput: "23", isPublic: true },
    ],
    hiddenTestCases: [
      { input: "-1 -2 -3 -4", expectedOutput: "-1", isPublic: false },
      { input: "-5 -1 -8", expectedOutput: "-1", isPublic: false },
      { input: "10 -20 30 40 -10", expectedOutput: "70", isPublic: false },
      { input: "0 0 0", expectedOutput: "0", isPublic: false },
    ],
    referenceSolution: {
      python: `import sys
nums = list(map(int, sys.stdin.read().strip().split()))
if nums:
    cur = mx = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)
        mx = max(mx, cur)
    print(mx)`,
    },
    referenceSolutionLanguage: "python",
    expectedTimeComplexity: "O(n)",
    expectedSpaceComplexity: "O(1)",
    requiredConcepts: ["Kadane's Algorithm", "Dynamic Programming"],
    prerequisiteConcepts: ["Arrays"],
    hints: [
      {
        level: 1,
        title: "Gentle Nudge",
        hint: "If the running sum becomes negative, would keeping it benefit any future subarray?",
      },
      {
        level: 2,
        title: "Algorithmic Direction",
        hint: "At each index i, you either extend the existing subarray (curr + nums[i]) or start a new subarray beginning at nums[i] (max(nums[i], curr + nums[i])).",
      },
      {
        level: 3,
        title: "Detailed Guidance",
        hint: "Keep two variables: curr = nums[0] and max_so_far = nums[0]. Iterate through the rest of the array, updating curr = max(num, curr + num) and max_so_far = max(max_so_far, curr).",
      },
    ],
    editorial: {
      mainIdea: "Kadane's algorithm greedily discards negative prefixes to maximize the current subarray ending at each position.",
      approach: "Maintain a running sum of the maximum subarray ending at index i. If the sum drops below nums[i], reset the subarray start to index i.",
      complexityExplanation: "Single linear pass over nums takes O(n) time with O(1) auxiliary variables.",
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
    },
    tags: ["arrays", "dynamic-programming", "greedy"],
    isPublished: true,
    orderIndex: 2,
  },
  {
    id: "dsa_arr_003",
    slug: "trapping-rain-water",
    title: "Trapping Rain Water",
    difficulty: "hard",
    primaryTopic: "arrays",
    secondaryTopics: ["two-pointers", "monotonic-stacks"],
    statement: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
    inputFormat: "A single line of space-separated integers representing heights of the elevation map.",
    outputFormat: "Print the total units of trapped rain water.",
    constraints: [
      "1 <= n <= 2 * 10^4",
      "0 <= height[i] <= 10^5",
    ],
    examples: [
      {
        input: "0 1 0 2 1 0 1 3 2 1 2 1",
        output: "6",
        explanation: "The elevation map [0,1,0,2,1,0,1,3,2,1,2,1] traps 6 units of rain water.",
      },
      {
        input: "4 2 0 3 2 5",
        output: "9",
        explanation: "The elevation map [4,2,0,3,2,5] traps 9 units of water.",
      },
    ],
    starterCode: {
      python: `import sys

def trap_rain_water():
    line = sys.stdin.read().strip()
    if not line:
        print(0)
        return
    height = list(map(int, line.split()))
    if len(height) < 3:
        print(0)
        return
        
    left, right = 0, len(height) - 1
    left_max, right_max = 0, 0
    trapped = 0
    
    while left < right:
        if height[left] < height[right]:
            if height[left] >= left_max:
                left_max = height[left]
            else:
                trapped += left_max - height[left]
            left += 1
        else:
            if height[right] >= right_max:
                right_max = height[right]
            else:
                trapped += right_max - height[right]
            right -= 1
            
    print(trapped)

if __name__ == "__main__":
    trap_rain_water()
`,
    },
    publicTestCases: [
      { input: "0 1 0 2 1 0 1 3 2 1 2 1", expectedOutput: "6", isPublic: true },
      { input: "4 2 0 3 2 5", expectedOutput: "9", isPublic: true },
      { input: "1 2", expectedOutput: "0", isPublic: true },
    ],
    hiddenTestCases: [
      { input: "3 0 0 2 0 4", expectedOutput: "10", isPublic: false },
      { input: "5 4 3 2 1", expectedOutput: "0", isPublic: false },
      { input: "2 0 2", expectedOutput: "2", isPublic: false },
      { input: "0 0 0 0", expectedOutput: "0", isPublic: false },
    ],
    referenceSolution: {
      python: `import sys
h = list(map(int, sys.stdin.read().strip().split()))
l, r = 0, len(h) - 1
l_max = r_max = ans = 0
while l < r:
    if h[l] < h[r]:
        if h[l] >= l_max: l_max = h[l]
        else: ans += l_max - h[l]
        l += 1
    else:
        if h[r] >= r_max: r_max = h[r]
        else: ans += r_max - h[r]
        r -= 1
print(ans)`,
    },
    referenceSolutionLanguage: "python",
    expectedTimeComplexity: "O(n)",
    expectedSpaceComplexity: "O(1)",
    requiredConcepts: ["Two Pointers", "Prefix Maximums"],
    prerequisiteConcepts: ["Arrays", "Two Pointers"],
    hints: [
      {
        level: 1,
        title: "Gentle Nudge",
        hint: "The water level above any bar i is bounded by min(max_left_height, max_right_height) - height[i].",
      },
      {
        level: 2,
        title: "Algorithmic Direction",
        hint: "Instead of computing prefix and suffix maximum arrays taking O(n) space, maintain two pointers converging from both boundaries.",
      },
      {
        level: 3,
        title: "Detailed Guidance",
        hint: "Initialize left = 0, right = n - 1, left_max = 0, right_max = 0. While left < right, advance the pointer with the smaller height, updating max and adding (max - current_height) to total.",
      },
    ],
    editorial: {
      mainIdea: "The water trapped at each index is determined by the minimum of the highest wall to its left and right, minus its own height.",
      approach: "Using two converging pointers from the outer ends, we can maintain running left_max and right_max, guaranteeing that the bottleneck side is always processed safely.",
      complexityExplanation: "Every element is visited at most once by either the left or right pointer, yielding O(n) time and O(1) auxiliary space.",
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
    },
    tags: ["arrays", "two-pointers", "monotonic-stacks"],
    isPublished: true,
    orderIndex: 3,
  },
];
