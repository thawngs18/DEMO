var PADDING = 12

function rectContains(rx, ry, rw, rh, px, py) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh
}

function lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
  if (y1 === y2) {
    return y1 >= ry && y1 <= ry + rh && Math.min(x1, x2) <= rx + rw && Math.max(x1, x2) >= rx
  }
  if (x1 === x2) {
    return x1 >= rx && x1 <= rx + rw && Math.min(y1, y2) <= ry + rh && Math.max(y1, y2) >= ry
  }
  return false
}

function findIntersectingObstacle(x1, y1, x2, y2, obstacles) {
  for (var i = 0; i < obstacles.length; i++) {
    var o = obstacles[i]
    var rx = o.x - PADDING
    var ry = o.y - PADDING
    var rw = o.w + PADDING * 2
    var rh = o.h + PADDING * 2
    if (lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh)) {
      return o
    }
  }
  return null
}

function computeMidpoints(sx, sy, tx, ty, sPos, tPos) {
  var offset = Math.min(Math.abs(tx - sx), Math.abs(ty - sy), 60) * 0.5
  if (offset < 20) offset = 20

  var mid1 = { x: sx, y: sy }
  var mid2 = { x: tx, y: ty }

  if (sPos === 'top') { mid1.y = sy - offset; mid2.y = ty + offset }
  else if (sPos === 'bottom') { mid1.y = sy + offset; mid2.y = ty - offset }
  else if (sPos === 'left') { mid1.x = sx - offset; mid2.x = tx + offset }
  else if (sPos === 'right') { mid1.x = sx + offset; mid2.x = tx - offset }

  var mid = {
    x: mid2.x === tx ? (mid1.x + tx) / 2 : mid1.x,
    y: mid1.y === sy ? (mid1.y + ty) / 2 : mid1.y,
  }

  return {
    p0: { x: sx, y: sy },
    p1: mid1,
    pMid: mid,
    p2: mid2,
    p3: { x: tx, y: ty },
  }
}

function avoidObstacle(x1, y1, x2, y2, obstacle, isHorizontal) {
  var ox = obstacle.x, oy = obstacle.y, ow = obstacle.w, oh = obstacle.h

  if (isHorizontal) {
    var distAbove = oy - PADDING - y1
    var distBelow = (y1) - (oy + oh + PADDING)
    var routeUp = distAbove >= 0 || distAbove > distBelow
    var wy = routeUp ? oy - PADDING : oy + oh + PADDING
    return [
      { x: x1, y: y1 },
      { x: x1 + (x2 - x1 < 0 ? -PADDING : x2 - x1 > 0 ? ow + PADDING * 2 : 0), y: routeUp ? Math.min(oy - PADDING, y1) : Math.max(oy + oh + PADDING, y1) },
      null,
    ]
  } else {
    var distLeft = ox - PADDING - x1
    var distRight = (x1) - (ox + ow + PADDING)
    var routeLeft = distLeft >= 0 || distLeft > distRight
    var wx = routeLeft ? ox - PADDING : ox + ow + PADDING
    return [
      { x: x1, y: y1 },
      { x: routeLeft ? Math.min(ox - PADDING, x1) : Math.max(ox + ow + PADDING, x1), y: y1 },
      null,
    ]
  }
}

export function computeSmartPath(sx, sy, tx, ty, sPos, tPos, obstacles) {
  if (!obstacles || obstacles.length === 0) return null

  var pts = computeMidpoints(sx, sy, tx, ty, sPos, tPos)

  var segments = [
    { x1: pts.p0.x, y1: pts.p0.y, x2: pts.p1.x, y2: pts.p1.y },
    { x1: pts.p1.x, y1: pts.p1.y, x2: pts.p2.x, y2: pts.p2.y },
    { x1: pts.p2.x, y1: pts.p2.y, x2: pts.p3.x, y2: pts.p3.y },
  ]

  var waypoints = [{ x: sx, y: sy }]

  for (var s = 0; s < segments.length; s++) {
    var seg = segments[s]
    var obs = findIntersectingObstacle(seg.x1, seg.y1, seg.x2, seg.y2, obstacles)
    if (obs) {
      var isHoriz = seg.y1 === seg.y2
      var detour = avoidObstacle(seg.x1, seg.y1, seg.x2, seg.y2, obs, isHoriz)

      if (s === 0) {
        waypoints.push({ x: seg.x1, y: isHoriz ? seg.y1 : (detour[1].y) })
      }

      if (isHoriz) {
        var wy = obs.y - PADDING
        if (seg.y1 < obs.y + obs.h + PADDING) wy = obs.y + obs.h + PADDING
        waypoints.push({ x: detour[1].x, y: detour[0].y })
        waypoints.push({ x: seg.x2, y: wy })
      } else {
        var wx = obs.x - PADDING
        if (seg.x1 < obs.x + obs.w + PADDING) wx = obs.x + obs.w + PADDING
        waypoints.push({ x: wx, y: detour[1].y })
        waypoints.push({ x: wx, y: seg.y2 })
      }
    }
  }

  waypoints.push({ x: tx, y: ty })

  // Deduplicate consecutive identical points
  var cleaned = [waypoints[0]]
  for (var i = 1; i < waypoints.length; i++) {
    var prev = cleaned[cleaned.length - 1]
    if (waypoints[i].x !== prev.x || waypoints[i].y !== prev.y) {
      cleaned.push(waypoints[i])
    }
  }

  if (cleaned.length <= 2) return null

  var path = 'M ' + cleaned[0].x + ' ' + cleaned[0].y
  for (var j = 1; j < cleaned.length; j++) {
    path += ' L ' + cleaned[j].x + ' ' + cleaned[j].y
  }

  return path
}