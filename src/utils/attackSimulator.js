export function findAttackPaths(nodes, edges) {
  var nodeMap = new Map(nodes.map(function(n) { return [n.id, n] }))
  var adjList = new Map()
  nodes.forEach(function(n) { adjList.set(n.id, []) })
  edges.forEach(function(e) {
    var list = adjList.get(e.source)
    if (list) list.push(e.target)
  })

  var attackers = nodes.filter(function(n) { return n.type === 'attacker' })
  var targets = nodes.filter(function(n) {
    return n.type === 'server' || n.type === 'database' || n.type === 'cloud'
  })

  var paths = []

  function dfs(current, targetId, visited, path) {
    if (current === targetId) {
      paths.push([].concat(path, [current]))
      return
    }
    var neighbors = adjList.get(current) || []
    for (var i = 0; i < neighbors.length; i++) {
      var neighbor = neighbors[i]
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        path.push(current)
        dfs(neighbor, targetId, visited, path)
        path.pop()
        visited.delete(neighbor)
      }
    }
  }

  for (var a = 0; a < attackers.length; a++) {
    for (var t = 0; t < targets.length; t++) {
      var visited = new Set([attackers[a].id])
      dfs(attackers[a].id, targets[t].id, visited, [])
    }
  }

  return paths.map(function(nodeIds) {
    var edgePairs = []
    for (var i = 0; i < nodeIds.length - 1; i++) {
      edgePairs.push([nodeIds[i], nodeIds[i + 1]])
    }
    return { nodeIds: nodeIds, edgePairs: edgePairs }
  })
}

export function checkDefenseBlocks(paths, nodes) {
  var securityIds = new Set(
    nodes.filter(function(n) { return n.type === 'firewall' || n.type === 'ips' || n.type === 'ids' })
      .map(function(n) { return n.id })
  )

  return paths.map(function(path) {
    var blockedAt = -1
    for (var i = 0; i < path.nodeIds.length; i++) {
      if (securityIds.has(path.nodeIds[i])) {
        blockedAt = i
        break
      }
    }
    return {
      nodeIds: path.nodeIds,
      edgePairs: path.edgePairs,
      blocked: blockedAt !== -1,
      blockedAtIndex: blockedAt === -1 ? 999999 : blockedAt,
    }
  })
}