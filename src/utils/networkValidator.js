var SECURITY_TYPES = new Set(['firewall', 'ips', 'ids'])

export function validateNetwork(nodes, edges) {
  var issues = []
  var nodeMap = new Map(nodes.map(function(n) { return [n.id, n] }))

  var connected = new Set()
  edges.forEach(function(e) {
    connected.add(e.source)
    connected.add(e.target)
  })
  nodes.forEach(function(n) {
    if (!connected.has(n.id)) {
      issues.push({ type: 'warn', message: n.id + ' is isolated - no connections' })
    }
  })

  if (edges.length === 0) {
    issues.push({ type: 'error', message: 'Network has zero connections' })
  }

  var hasAttacker = nodes.some(function(n) { return n.type === 'attacker' })
  if (!hasAttacker) {
    issues.push({ type: 'warn', message: 'No Attacker node placed - add one to run simulations' })
  }

  edges.forEach(function(e) {
    var source = nodeMap.get(e.source)
    var target = nodeMap.get(e.target)
    if (source && SECURITY_TYPES.has(source.type) && target && target.type === 'attacker') {
      issues.push({ type: 'error', message: 'Security placed behind ' + target.id + ' - illogical' })
    }
  })

  return {
    valid: issues.filter(function(i) { return i.type === 'error' }).length === 0,
    issues: issues,
  }
}