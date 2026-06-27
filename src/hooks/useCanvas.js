import { useCallback } from 'react'
import { MarkerType } from 'reactflow'
import useStore from '../store/useStore'

export function useCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, setEdges } = useStore()

  const addNodeFromPalette = useCallback(
    function(type, position) {
      const newId = type + '-' + Date.now()
      const newNode = {
        id: newId,
        type: 'custom',
        position,
        data: { type: type, label: type.charAt(0).toUpperCase() + type.slice(1) },
      }
      setNodes([].concat(nodes, [newNode]))
    },
    [nodes, setNodes],
  )

  const addEdgeWithMarker = useCallback(
    function(source, target) {
      const newEdge = {
        id: 'e-' + source + '-' + target,
        source: source,
        target: target,
        animated: false,
        style: { stroke: '#00f0ff', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#00f0ff' },
      }
      onConnect(newEdge)
    },
    [onConnect],
  )

  return { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNodeFromPalette, addEdgeWithMarker }
}