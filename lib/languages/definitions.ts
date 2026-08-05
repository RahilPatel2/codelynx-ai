export interface LanguageDefinition {
  id: string; // Internal id (e.g., 'python', 'cpp')
  name: string; // Display name
  monacoLanguage: string;
  extension: string;
  judge0Id: number; // Judge0 standard language ID
  defaultFileName: string;
  starterTemplate: string;
  version: string;
  iconName: string;
  isCompiled: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageDefinition[] = [
  {
    id: "python",
    name: "Python 3",
    monacoLanguage: "python",
    extension: "py",
    judge0Id: 71, // Python 3.8.1
    defaultFileName: "main.py",
    version: "3.10+",
    iconName: "FileCode",
    isCompiled: false,
    starterTemplate: `"""
CODELYNX AI - Python Starter Template
Algorithm: Two Sum Problem (O(n) Time, O(n) Space)
"""

def two_sum(nums: list[int], target: int) -> list[int]:
    lookup = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in lookup:
            return [lookup[complement], i]
        lookup[num] = i
    return []

if __name__ == "__main__":
    test_nums = [2, 7, 11, 15]
    target_val = 9
    result = two_sum(test_nums, target_val)
    print(f"Input: nums = {test_nums}, target = {target_val}")
    print(f"Output indices: {result}")
    print(f"Values: {[test_nums[i] for i in result]}")
`,
  },
  {
    id: "cpp",
    name: "C++ (GCC)",
    monacoLanguage: "cpp",
    extension: "cpp",
    judge0Id: 54, // C++ (GCC 9.2.0)
    defaultFileName: "main.cpp",
    version: "C++17",
    iconName: "Code2",
    isCompiled: true,
    starterTemplate: `/**
 * CODELYNX AI - C++ Template
 * QuickSort Implementation with Complexity Analysis
 */
#include <iostream>
#include <vector>

int partition(std::vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = (low - 1);
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            std::swap(arr[i], arr[j]);
        }
    }
    std::swap(arr[i + 1], arr[high]);
    return (i + 1);
}

void quickSort(std::vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int main() {
    std::vector<int> arr = {64, 34, 25, 12, 22, 11, 90};
    std::cout << "Original array: ";
    for (int x : arr) std::cout << x << " ";
    std::cout << "\\n";

    quickSort(arr, 0, arr.size() - 1);

    std::cout << "Sorted array: ";
    for (int x : arr) std::cout << x << " ";
    std::cout << "\\n";
    return 0;
}
`,
  },
  {
    id: "javascript",
    name: "JavaScript (Node.js)",
    monacoLanguage: "javascript",
    extension: "js",
    judge0Id: 63, // JavaScript (Node.js 12.14.0 / modern)
    defaultFileName: "index.js",
    version: "ES2024",
    iconName: "FileJson",
    isCompiled: false,
    starterTemplate: `/**
 * CODELYNX AI - JavaScript Starter
 * LRU Cache implementation demonstration
 */

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}

const lru = new LRUCache(2);
lru.put(1, "Alpha");
lru.put(2, "Beta");
console.log("Get 1:", lru.get(1)); // Alpha
lru.put(3, "Gamma"); // Evicts 2
console.log("Get 2 (evicted):", lru.get(2)); // -1
console.log("Get 3:", lru.get(3)); // Gamma
console.log("LRU operations complete successfully!");
`,
  },
  {
    id: "typescript",
    name: "TypeScript",
    monacoLanguage: "typescript",
    extension: "ts",
    judge0Id: 74, // TypeScript (3.7.4 / modern)
    defaultFileName: "index.ts",
    version: "5.6",
    iconName: "FileCode",
    isCompiled: true,
    starterTemplate: `/**
 * CODELYNX AI - TypeScript Starter
 * Generic Binary Search Tree
 */

interface TreeNode<T> {
  value: T;
  left: TreeNode<T> | null;
  right: TreeNode<T> | null;
}

class BinarySearchTree<T> {
  root: TreeNode<T> | null = null;

  insert(val: T): void {
    const newNode: TreeNode<T> = { value: val, left: null, right: null };
    if (!this.root) {
      this.root = newNode;
      return;
    }
    let curr = this.root;
    while (true) {
      if (val < curr.value) {
        if (!curr.left) { curr.left = newNode; break; }
        curr = curr.left;
      } else {
        if (!curr.right) { curr.right = newNode; break; }
        curr = curr.right;
      }
    }
  }

  inOrderTraversal(node = this.root, result: T[] = []): T[] {
    if (node) {
      this.inOrderTraversal(node.left, result);
      result.push(node.value);
      this.inOrderTraversal(node.right, result);
    }
    return result;
  }
}

const bst = new BinarySearchTree<number>();
[50, 30, 70, 20, 40, 60, 80].forEach(n => bst.insert(n));
console.log("In-order sorted traversal:", bst.inOrderTraversal());
`,
  },
  {
    id: "java",
    name: "Java (OpenJDK)",
    monacoLanguage: "java",
    extension: "java",
    judge0Id: 62, // Java (OpenJDK 13.0.1)
    defaultFileName: "Main.java",
    version: "Java 17",
    iconName: "Coffee",
    isCompiled: true,
    starterTemplate: `/**
 * CODELYNX AI - Java Starter
 * Breadth-First Search (BFS) on Graph
 */
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Map<Integer, List<Integer>> graph = new HashMap<>();
        graph.put(1, Arrays.asList(2, 3));
        graph.put(2, Arrays.asList(4, 5));
        graph.put(3, Arrays.asList(6));
        graph.put(4, new ArrayList<>());
        graph.put(5, new ArrayList<>());
        graph.put(6, new ArrayList<>());

        System.out.println("Starting BFS traversal from Node 1:");
        Queue<Integer> queue = new LinkedList<>();
        Set<Integer> visited = new HashSet<>();

        queue.add(1);
        visited.add(1);

        while (!queue.isEmpty()) {
            int node = queue.poll();
            System.out.print(node + " -> ");
            for (int neighbor : graph.getOrDefault(node, Collections.emptyList())) {
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    queue.add(neighbor);
                }
            }
        }
        System.out.println("END");
    }
}
`,
  },
  {
    id: "c",
    name: "C (GCC)",
    monacoLanguage: "c",
    extension: "c",
    judge0Id: 50, // C (GCC 9.2.0)
    defaultFileName: "main.c",
    version: "C11",
    iconName: "Terminal",
    isCompiled: true,
    starterTemplate: `/*
 * CODELYNX AI - C Starter
 * Dynamic Array / Vector in C
 */
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int* data;
    size_t size;
    size_t capacity;
} Vector;

Vector create_vector(size_t initial_cap) {
    Vector v;
    v.data = (int*)malloc(initial_cap * sizeof(int));
    v.size = 0;
    v.capacity = initial_cap;
    return v;
}

void vector_push(Vector* v, int val) {
    if (v->size == v->capacity) {
        v->capacity *= 2;
        v->data = (int*)realloc(v->data, v->capacity * sizeof(int));
    }
    v->data[v->size++] = val;
}

int main() {
    Vector vec = create_vector(2);
    for (int i = 1; i <= 5; i++) {
        vector_push(&vec, i * 10);
    }
    printf("Vector elements (size=%zu, capacity=%zu):\\n", vec.size, vec.capacity);
    for (size_t i = 0; i < vec.size; i++) {
        printf("vec[%zu] = %d\\n", i, vec.data[i]);
    }
    free(vec.data);
    return 0;
}
`,
  },
  {
    id: "csharp",
    name: "C# (Mono / .NET)",
    monacoLanguage: "csharp",
    extension: "cs",
    judge0Id: 51, // C# (Mono 6.6.0.161)
    defaultFileName: "Program.cs",
    version: "10.0",
    iconName: "Cpu",
    isCompiled: true,
    starterTemplate: `using System;
using System.Linq;
using System.Collections.Generic;

namespace CodeLynxDemo
{
    class Program
    {
        static void Main(string[] args)
        {
            var numbers = new List<int> { 5, 2, 8, 14, 1, 9, 23, 7 };
            Console.WriteLine("Original list: " + string.Join(", ", numbers));

            var evens = numbers.Where(n => n % 2 == 0).OrderBy(n => n).ToList();
            Console.WriteLine("Filtered & sorted evens: " + string.Join(", ", evens));

            int sum = numbers.Aggregate(0, (acc, x) => acc + x);
            Console.WriteLine($"Total sum: {sum}");
        }
    }
}
`,
  },
  {
    id: "go",
    name: "Go",
    monacoLanguage: "go",
    extension: "go",
    judge0Id: 60, // Go (1.13.5 / modern)
    defaultFileName: "main.go",
    version: "1.21+",
    iconName: "Zap",
    isCompiled: true,
    starterTemplate: `package main

import (
	"fmt"
	"sync"
	"time"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
	defer wg.Done()
	for j := range jobs {
		fmt.Printf("Worker %d processing job %d\\n", id, j)
		time.Sleep(10 * time.Millisecond)
		results <- j * 2
	}
}

func main() {
	const numJobs = 5
	jobs := make(chan int, numJobs)
	results := make(chan int, numJobs)

	var wg sync.WaitGroup
	for w := 1; w <= 3; w++ {
		wg.Add(1)
		go worker(w, jobs, results, &wg)
	}

	for j := 1; j <= numJobs; j++ {
		jobs <- j
	}
	close(jobs)

	wg.Wait()
	close(results)

	fmt.Println("Completed worker results:")
	for res := range results {
		fmt.Println("Result:", res)
	}
}
`,
  },
  {
    id: "rust",
    name: "Rust",
    monacoLanguage: "rust",
    extension: "rs",
    judge0Id: 73, // Rust (1.40.0 / modern)
    defaultFileName: "main.rs",
    version: "2021",
    iconName: "Shield",
    isCompiled: true,
    starterTemplate: `// CODELYNX AI - Rust Starter
// Fibonacci generator with iterator pattern

struct Fibonacci {
    curr: u64,
    next: u64,
}

impl Fibonacci {
    fn new() -> Self {
        Fibonacci { curr: 0, next: 1 }
    }
}

impl Iterator for Fibonacci {
    type Item = u64;
    fn next(&mut self) -> Option<Self::Item> {
        let current = self.curr;
        self.curr = self.next;
        self.next = current + self.next;
        Some(current)
    }
}

fn main() {
    let fib_sequence: Vec<u64> = Fibonacci::new().take(10).collect();
    println!("First 10 Fibonacci numbers in Rust:");
    println!("{:?}", fib_sequence);
}
`,
  },
  {
    id: "sql",
    name: "SQL",
    monacoLanguage: "sql",
    extension: "sql",
    judge0Id: 82, // SQLite 3
    defaultFileName: "query.sql",
    version: "ANSI SQL",
    iconName: "Database",
    isCompiled: false,
    starterTemplate: `-- CODELYNX AI - SQL Starter
CREATE TABLE developers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    favorite_language TEXT NOT NULL,
    experience_years INTEGER NOT NULL
);

INSERT INTO developers (name, favorite_language, experience_years) VALUES
('Alex Lynx', 'Rust', 5),
('Elena Vance', 'Python', 7),
('Marcus Brody', 'TypeScript', 4),
('Sarah Connor', 'C++', 9);

-- Query: average experience grouped by language
SELECT favorite_language, COUNT(*) AS dev_count, AVG(experience_years) AS avg_exp
FROM developers
GROUP BY favorite_language
ORDER BY avg_exp DESC;
`,
  },
];

export function getLanguageById(id: string): LanguageDefinition {
  return (
    SUPPORTED_LANGUAGES.find((lang) => lang.id === id) || SUPPORTED_LANGUAGES[0]
  );
}

export function getLanguageByJudge0Id(
  judge0Id: number
): LanguageDefinition | undefined {
  return SUPPORTED_LANGUAGES.find((lang) => lang.judge0Id === judge0Id);
}
