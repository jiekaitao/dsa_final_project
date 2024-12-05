interface BFSResult {
  distance: number;
  path: string[];
  visited: string[];
}

interface DFSResult extends TraversalResult {}

interface TraversalStep {
  node: string;
  parent?: string;
}

interface TraversalResult extends BFSResult {
  steps: TraversalStep[];
}

export const bfs = (
  graph: { [key: string]: Array<{ target: string }> }, 
  src: string, 
  targ: string
): TraversalResult => {
  const queue: string[] = [src];
  const visited = new Set<string>();
  const count: { [key: string]: number } = { [src]: 0 };
  const parent: { [key: string]: string } = {};
  const visitedOrder: string[] = [];
  const steps: TraversalStep[] = [{ node: src }];

  visited.add(src);
  visitedOrder.push(src);
  
  if (src === targ) {
    return { distance: 0, path: [src], visited: visitedOrder, steps };
  }

  // while the queue is not empty
  while (queue.length > 0) {
    // take u out and visit
    const u = queue.shift()!;

    // for adjacent nodes, mark visited if not already, and check if we have reached
    for (const v of graph[u]) {
      const v_id = v.target;

      if (v_id === targ) {
        const path = [v_id];
        let current = u;
        while (current !== src) {
          path.unshift(current);
          current = parent[current];
        }
        path.unshift(src);
        
        return {
          distance: count[u] + 1,
          path,
          visited: visitedOrder,
          steps
        };
      }

      if (!visited.has(v_id)) {
        visited.add(v_id);
        visitedOrder.push(v_id);
        count[v_id] = count[u] + 1;
        parent[v_id] = u;
        queue.push(v_id);
        steps.push({ node: v_id, parent: u });
      }
    }
  }

  // return -1 if unreachable
  return { distance: -1, path: [], visited: visitedOrder, steps };
}; 

export const dfs = (
  graph: { [key: string]: Array<{ target: string }> }, 
  src: string, 
  targ: string
): DFSResult => {
  const visited = new Set<string>();
  const visitedOrder: string[] = [];
  const path: string[] = [];
  const steps: TraversalStep[] = [{ node: src }];
  let targetFound = false;
  let finalDistance = -1;

  const dfsRecursive = (current: string, parent: string | undefined, distance: number): void => {
    // base case: if target is found or already visited
    if (targetFound || visited.has(current)) return;

    visited.add(current);
    visitedOrder.push(current);
    path.push(current);

    if (parent) {
      steps.push({ node: current, parent });
    }

    // target found
    if (current === targ) {
      targetFound = true;
      finalDistance = distance;
      return;
    }

    for (const neighbor of graph[current] || []) {
      if (!visited.has(neighbor.target)) {
        dfsRecursive(neighbor.target, current, distance + 1);
        if (targetFound) return; // Stop exploring other paths if target is found
      }
    }

    // backtrack since not found
    if (!targetFound) {
      path.pop();
    }
  };

  // Start DFS from node_1 (source node)
  dfsRecursive(src, undefined, 0);

  return {
    distance: finalDistance,
    path: targetFound ? path : [],
    visited: visitedOrder,
    steps
  };
}; 