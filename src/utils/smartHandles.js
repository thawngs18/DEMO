var DEFAULT_NODE_WIDTH = 148
var DEFAULT_NODE_HEIGHT = 72

function getNodeCenter(node) {
  var w = node.width || DEFAULT_NODE_WIDTH
  var h = node.height || DEFAULT_NODE_HEIGHT
  return {
    x: node.position.x + w / 2,
    y: node.position.y + h / 2,
  }
}

export function getBestHandle(node, connectedNode, handleType) {
  var center = getNodeCenter(node)
  var otherCenter = getNodeCenter(connectedNode)

  var dx = otherCenter.x - center.x
  var dy = otherCenter.y - center.y

  if (Math.abs(dx) > Math.abs(dy)) {
    return (dx > 0 ? 'right' : 'left') + '-' + handleType
  }
  return (dy > 0 ? 'bottom' : 'top') + '-' + handleType
}