import { DSAProblem } from "../types";

export const STRING_PROBLEMS: DSAProblem[] = [
  {
    id: "dsa_str_001",
    slug: "valid-anagram-frequency",
    title: "Valid Anagram Verification",
    difficulty: "easy",
    primaryTopic: "strings",
    secondaryTopics: ["hashing", "sorting"],
    statement: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    inputFormat: "Two lines: the first line contains string s, and the second line contains string t.",
    outputFormat: "Print 'true' if t is an anagram of s, otherwise print 'false'.",
    constraints: [
      "1 <= s.length, t.length <= 5 * 10^4",
      "s and t consist of lowercase English letters.",
    ],
    examples: [
      {
        input: "anagram\nnagaram",
        output: "true",
        explanation: "Both strings contain the exact same letter counts.",
      },
      {
        input: "rat\ncar",
        output: "false",
        explanation: "'r' occurs once in both, but 'a' vs 'c' differ.",
      },
    ],
    starterCode: {
      python: `import sys

def is_anagram():
    lines = sys.stdin.read().strip().split('\\n')
    if len(lines) < 2: return
    s = lines[0].strip()
    t = lines[1].strip()
    
    if len(s) != len(t):
        print("false")
        return
        
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    for ch in t:
        if ch not in counts or counts[ch] == 0:
            print("false")
            return
        counts[ch] -= 1
        
    print("true")

if __name__ == "__main__":
    is_anagram()
`,
      cpp: `#include <iostream>
#include <string>
#include <vector>

using namespace std;

int main() {
    string s, t;
    if (!(cin >> s >> t)) return 0;
    if (s.length() != t.length()) {
        cout << "false" << endl;
        return 0;
    }
    vector<int> freq(26, 0);
    for (char c : s) freq[c - 'a']++;
    for (char c : t) {
        if (--freq[c - 'a'] < 0) {
            cout << "false" << endl;
            return 0;
        }
    }
    cout << "true" << endl;
    return 0;
}
`,
    },
    publicTestCases: [
      { input: "anagram\nnagaram", expectedOutput: "true", isPublic: true },
      { input: "rat\ncar", expectedOutput: "false", isPublic: true },
    ],
    hiddenTestCases: [
      { input: "a\nab", expectedOutput: "false", isPublic: false },
      { input: "listen\nsilent", expectedOutput: "true", isPublic: false },
      { input: "aabbcc\nbbaacc", expectedOutput: "true", isPublic: false },
      { input: "triangle\nintegral", expectedOutput: "true", isPublic: false },
    ],
    referenceSolution: {
      python: `import sys
lines = sys.stdin.read().strip().split('\\n')
s, t = lines[0].strip(), lines[1].strip()
if len(s) != len(t):
    print("false")
else:
    c = {}
    for ch in s: c[ch] = c.get(ch, 0) + 1
    for ch in t:
        if ch not in c or c[ch] == 0:
            print("false")
            sys.exit(0)
        c[ch] -= 1
    print("true")`,
    },
    referenceSolutionLanguage: "python",
    expectedTimeComplexity: "O(n)",
    expectedSpaceComplexity: "O(1)",
    requiredConcepts: ["Frequency Array", "Hash Map"],
    prerequisiteConcepts: ["Strings", "Hashing"],
    hints: [
      {
        level: 1,
        title: "Gentle Nudge",
        hint: "If the lengths of s and t are different, can they ever be anagrams?",
      },
      {
        level: 2,
        title: "Algorithmic Direction",
        hint: "Because there are only 26 lowercase English letters, a fixed-size frequency array of length 26 can count occurrences.",
      },
      {
        level: 3,
        title: "Detailed Guidance",
        hint: "Increment count for characters in s, and decrement count for characters in t. If any count ends up negative or non-zero, return false.",
      },
    ],
    editorial: {
      mainIdea: "Two strings are anagrams if and only if each unique character appears the exact same number of times in both.",
      approach: "Verify length equality first. Tally character counts using a size-26 integer array. Subtract counts while iterating through the second string.",
      complexityExplanation: "Iterating through strings of length n takes O(n) time. The frequency array has fixed length 26, using O(1) auxiliary space.",
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
    },
    tags: ["strings", "hashing"],
    isPublished: true,
    orderIndex: 4,
  },
  {
    id: "dsa_str_002",
    slug: "longest-substring-without-repeating-characters",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium",
    primaryTopic: "strings",
    secondaryTopics: ["sliding-window", "hashing"],
    statement: `Given a string \`s\`, find the length of the **longest substring** without duplicate characters.

A **substring** is a contiguous sequence of characters within a string.`,
    inputFormat: "A single line containing the string s.",
    outputFormat: "Print a single integer representing the maximum length.",
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces.",
    ],
    examples: [
      {
        input: "abcabcbb",
        output: "3",
        explanation: "The answer is 'abc', with the length of 3.",
      },
      {
        input: "bbbbb",
        output: "1",
        explanation: "The answer is 'b', with the length of 1.",
      },
      {
        input: "pwwkew",
        output: "3",
        explanation: "The answer is 'wke', with the length of 3.",
      },
    ],
    starterCode: {
      python: `import sys

def length_of_longest_substring():
    line = sys.stdin.read()
    if line.endswith('\\n'): line = line[:-1]
    if not line:
        print(0)
        return
        
    last_pos = {}
    max_len = 0
    left = 0
    
    for right, ch in enumerate(line):
        if ch in last_pos and last_pos[ch] >= left:
            left = last_pos[ch] + 1
        last_pos[ch] = right
        max_len = max(max_len, right - left + 1)
        
    print(max_len)

if __name__ == "__main__":
    length_of_longest_substring()
`,
    },
    publicTestCases: [
      { input: "abcabcbb", expectedOutput: "3", isPublic: true },
      { input: "bbbbb", expectedOutput: "1", isPublic: true },
      { input: "pwwkew", expectedOutput: "3", isPublic: true },
    ],
    hiddenTestCases: [
      { input: " ", expectedOutput: "1", isPublic: false },
      { input: "au", expectedOutput: "2", isPublic: false },
      { input: "dvdf", expectedOutput: "3", isPublic: false },
      { input: "abcdefghijklmnopqrstuvwxyz", expectedOutput: "26", isPublic: false },
    ],
    referenceSolution: {
      python: `import sys
s = sys.stdin.read()
if s.endswith('\\n'): s = s[:-1]
seen = {}
l = mx = 0
for r, c in enumerate(s):
    if c in seen and seen[c] >= l:
        l = seen[c] + 1
    seen[c] = r
    mx = max(mx, r - l + 1)
print(mx)`,
    },
    referenceSolutionLanguage: "python",
    expectedTimeComplexity: "O(n)",
    expectedSpaceComplexity: "O(min(n, m))",
    requiredConcepts: ["Sliding Window", "Hash Map"],
    prerequisiteConcepts: ["Strings", "Two Pointers"],
    hints: [
      {
        level: 1,
        title: "Gentle Nudge",
        hint: "Can you maintain a sliding window [left, right] such that every character inside is unique?",
      },
      {
        level: 2,
        title: "Algorithmic Direction",
        hint: "Store the last seen index of each character. When a duplicate appears at right, jump left directly to last_index + 1.",
      },
      {
        level: 3,
        title: "Detailed Guidance",
        hint: "Maintain `last_pos = {}` and `left = 0`. Iterate `right` from 0 to n - 1. If `s[right]` in map and `last_pos[s[right]] >= left`, set `left = last_pos[s[right]] + 1`. Update `max_len = max(max_len, right - left + 1)`.",
      },
    ],
    editorial: {
      mainIdea: "A dynamic sliding window keeps track of the current substring of unique characters in linear time.",
      approach: "Using a hash table to record the most recent index of each character enables the left boundary to skip directly past the previous occurrence without shrinking one-by-one.",
      complexityExplanation: "Both left and right pointers traverse the string at most once, yielding O(n) runtime with O(min(n, alphabet)) auxiliary space.",
      timeComplexity: "O(n)",
      spaceComplexity: "O(min(n, m))",
    },
    tags: ["strings", "sliding-window", "hashing"],
    isPublished: true,
    orderIndex: 5,
  },
];
