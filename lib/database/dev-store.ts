export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  googleId?: string;
  avatarUrl?: string;
  bio?: string;
  role?: string;
  company?: string;
  githubHandle?: string;
  status?: string;
  authProvider?: "credentials" | "google";
  subscription?: {
    plan: "FREE" | "PROFESSIONAL" | "PRO";
    status: string;
    priceInr?: number;
    currency?: string;
    purchaseMode?: string;
    activatedAt?: string;
  };
  preferences: Record<string, any>;
  createdAt: string;
}

export interface StoredSubscription {
  userId: string;
  userEmail: string;
  planId: "free" | "professional" | "pro";
  planName: "FREE" | "PROFESSIONAL" | "PRO";
  priceInr: number;
  currency: "INR";
  billingCycle: "monthly";
  status: "active" | "cancelled" | "past_due";
  activatedAt: string;
  expiresAt: string | null;
  purchaseMode: "simulated" | "real";
  subscriptionSource: "simulated_checkout" | "registration" | "system";
  history: Array<{
    fromPlan: string;
    toPlan: string;
    timestamp: string;
    mode: "simulated" | "real";
    notes?: string;
  }>;
}

export interface StoredProject {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  language: string;
  files: { id: string; name: string; content: string; language: string }[];
  activeFileId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StoredExecution {
  id: string;
  ownerId: string;
  projectId?: string;
  language: string;
  sourceSnippet: string;
  status:
    | "queued"
    | "processing"
    | "accepted"
    | "compilation_error"
    | "runtime_error"
    | "time_limit_exceeded"
    | "memory_limit_exceeded"
    | "error";
  exitCode: number;
  stdout: string;
  stderr: string;
  compileOutput: string;
  executionTime: number;
  memoryUsage: number;
  provider: string;
  createdAt: string;
}

// In-memory fallback repository with initial demo data
class DevStore {
  public users: Map<string, StoredUser> = new Map();
  public projects: Map<string, StoredProject> = new Map();
  public executions: StoredExecution[] = [];
  public conversations: Map<string, any> = new Map();
  public codingPlans: Map<string, any> = new Map();
  public dsaProblems: Map<string, any> = new Map();
  public dsaSubmissions: any[] = [];
  public dsaProgress: Map<string, any> = new Map();
  public dsaDrafts: Map<string, any> = new Map();
  public subscriptions: Map<string, StoredSubscription> = new Map();
  public dailyAiUsage: Map<string, number> = new Map();

  constructor() {
    this.seedDemoData();
  }

  private seedDemoData() {
    // Demo user: demo@codelynx.ai (password: Password123!)
    // Pre-computed bcrypt hash of 'Password123!'
    const demoUserId = "usr_demo_developer";
    this.subscriptions.set(demoUserId, {
      userId: demoUserId,
      userEmail: "demo@codelynx.ai",
      planId: "pro",
      planName: "PRO",
      priceInr: 899,
      currency: "INR",
      billingCycle: "monthly",
      status: "active",
      activatedAt: new Date().toISOString(),
      expiresAt: null,
      purchaseMode: "simulated",
      subscriptionSource: "system",
      history: [
        {
          fromPlan: "FREE",
          toPlan: "PRO",
          timestamp: new Date().toISOString(),
          mode: "simulated",
          notes: "Initial seeded staff engineer entitlement",
        },
      ],
    });

    this.users.set("demo@codelynx.ai", {
      id: demoUserId,
      name: "Alex Lynx (Staff Engineer)",
      email: "demo@codelynx.ai",
      passwordHash: "$2a$10$v7m2yE6eS8u6bVl6W.9Rse2o8kQ4uW5wW7M2u9N9jT5k1bZk9q2mO",
      role: "Staff Infrastructure Engineer",
      company: "CodeLynx AI Labs",
      bio: "Distributed systems architect, algorithmic optimization enthusiast, and Staff Developer at CodeLynx.",
      githubHandle: "alexlynx-dev",
      status: "active",
      authProvider: "credentials",
      subscription: {
        plan: "PRO",
        status: "active",
        priceInr: 899,
        currency: "INR",
        purchaseMode: "simulated",
        activatedAt: new Date().toISOString(),
      },
      preferences: {
        theme: "dark",
        defaultLanguage: "python",
        fontSize: 14,
        minimap: true,
        wordWrap: true,
        aiModel: "gemini-2.5-flash",
        verbosity: "balanced",
      },
      createdAt: new Date().toISOString(),
    });

    // Seed Sample Project 1: Two Sum & Hash Maps
    this.projects.set("proj_1", {
      id: "proj_1",
      name: "Two-Sum Hash Map Solution",
      description: "Optimized two-pointer and hash table lookup with O(n) complexity",
      ownerId: demoUserId,
      language: "python",
      files: [
        {
          id: "f_1",
          name: "main.py",
          language: "python",
          content: `def two_sum(nums: list[int], target: int) -> list[int]:
    lookup = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in lookup:
            return [lookup[complement], i]
        lookup[num] = i
    return []

if __name__ == "__main__":
    nums = [2, 7, 11, 15]
    target = 9
    print("Found indices:", two_sum(nums, target))
`,
        },
        {
          id: "f_2",
          name: "test_two_sum.py",
          language: "python",
          content: `from main import two_sum

def test_basic():
    assert two_sum([2, 7, 11, 15], 9) == [0, 1]
    assert two_sum([3, 2, 4], 6) == [1, 2]
    assert two_sum([3, 3], 6) == [0, 1]
    print("All unit tests passed successfully!")

if __name__ == "__main__":
    test_basic()
`,
        },
      ],
      activeFileId: "f_1",
      tags: ["algorithms", "arrays", "hash-map"],
      createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    });

    // Seed Sample Project 2: QuickSort Partition in C++
    this.projects.set("proj_2", {
      id: "proj_2",
      name: "QuickSort Partition Engine",
      description: "Divide-and-conquer randomized pivot sorting implementation",
      ownerId: demoUserId,
      language: "cpp",
      files: [
        {
          id: "f_cpp_1",
          name: "quicksort.cpp",
          language: "cpp",
          content: `#include <iostream>
#include <vector>

int partition(std::vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            std::swap(arr[i], arr[j]);
        }
    }
    std::swap(arr[i + 1], arr[high]);
    return i + 1;
}

void quickSort(std::vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int main() {
    std::vector<int> arr = {10, 7, 8, 9, 1, 5};
    quickSort(arr, 0, arr.size() - 1);
    std::cout << "Sorted array: ";
    for (int x : arr) std::cout << x << " ";
    std::cout << std::endl;
    return 0;
}
`,
        },
      ],
      activeFileId: "f_cpp_1",
      tags: ["sorting", "cpp", "divide-and-conquer"],
      createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    });

    // Seed Sample Executions
    this.executions.push(
      {
        id: "exec_1",
        ownerId: demoUserId,
        projectId: "proj_1",
        language: "python",
        sourceSnippet: "def two_sum(nums, target)...",
        status: "accepted",
        exitCode: 0,
        stdout: "Found indices: [0, 1]\n",
        stderr: "",
        compileOutput: "",
        executionTime: 42,
        memoryUsage: 3410,
        provider: "judge0-ce",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: "exec_2",
        ownerId: demoUserId,
        projectId: "proj_2",
        language: "cpp",
        sourceSnippet: "#include <iostream>...",
        status: "accepted",
        exitCode: 0,
        stdout: "Sorted array: 1 5 7 8 9 10 \n",
        stderr: "",
        compileOutput: "Compiling with g++ -O2...",
        executionTime: 18,
        memoryUsage: 2150,
        provider: "judge0-ce",
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      }
    );
  }
}

declare global {
  // eslint-disable-next-line no-var
  var devStoreInstance: DevStore | undefined;
}

export const devStore = global.devStoreInstance || new DevStore();
if (!global.devStoreInstance) {
  global.devStoreInstance = devStore;
}
