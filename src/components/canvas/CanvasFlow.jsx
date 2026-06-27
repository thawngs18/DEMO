import { useCallback, useRef, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import useStore from '../../store/useStore'
import CustomNode from './CustomNode'
import CustomEdge from './CustomEdge'
import AttackPathOverlay from '../panels/AttackPathOverlay'
import { getBestHandle } from '../../utils/smartHandles'

const nodeTypes = { custom: CustomNode }
const edgeTypes = { custom: CustomEdge }

export default function CanvasFlow() {
  const reactFlowWrapper = useRef(null)
  const reactFlowInstance = useRef(null)
  const theme = useStore(function(s) { return s.theme })
  const isDark = theme === 'dark'
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addLog, setNodes, setEdges } =
    useStore()

  var defaultEdgeOptions = {
    type: 'custom',
    animated: false,
    style: { stroke: isDark ? '#00f0ff' : '#94a3b8', strokeWidth: 2 },
  }

  useEffect(function() {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        var target = e.target
        if (target && target.closest && target.closest('.react-flow')) {
          e.preventDefault()
          var store = useStore.getState()
          store.setNodes(store.nodes.map(function(n) { return { ...n, selected: true } }))
          store.setEdges(store.edges.map(function(e) { return { ...e, selected: true } }))
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return function() { document.removeEventListener('keydown', handleKeyDown) }
  }, [])

  const onDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event) => {
      event.preventDefault()
      const nodeType = event.dataTransfer.getData('application/reactflow')
      if (!nodeType || !reactFlowInstance.current) return

      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      const newId = nodeType + '-' + Date.now()
      const newNode = {
        id: newId,
        type: 'custom',
        position,
        data: { type: nodeType, label: nodeType.charAt(0).toUpperCase() + nodeType.slice(1) },
      }

      setNodes([...nodes, newNode])
      addLog({
        text: '+ Placed ' + nodeType + ' at (' + Math.round(position.x) + ', ' + Math.round(position.y) + ')',
        type: 'info',
      })
    },
    [nodes, setNodes, addLog],
  )

  const onNodeClick = useCallback((_event, node) => {
    useStore.getState().setSelectedNode(node)
    useStore.getState().setMode('edit')
  }, [])

  var onNodeDrag = useCallback(function(_event, draggedNode) {
    var store = useStore.getState()
    var allNodes = store.nodes
    var allEdges = store.edges
    var updateEdgeHandles = store.updateEdgeHandles

    for (var i = 0; i < allEdges.length; i++) {
      var edge = allEdges[i]
      if (edge.source !== draggedNode.id && edge.target !== draggedNode.id) continue

      var otherId = edge.source === draggedNode.id ? edge.target : edge.source
      var otherNode = null
      for (var j = 0; j < allNodes.length; j++) {
        if (allNodes[j].id === otherId) { otherNode = allNodes[j]; break }
      }
      if (!otherNode) continue

      var newSourceHandle = getBestHandle(
        edge.source === draggedNode.id ? draggedNode : otherNode,
        edge.source === draggedNode.id ? otherNode : draggedNode,
        'source',
      )
      var newTargetHandle = getBestHandle(
        edge.target === draggedNode.id ? draggedNode : otherNode,
        edge.target === draggedNode.id ? otherNode : draggedNode,
        'target',
      )

      if (newSourceHandle !== edge.sourceHandle || newTargetHandle !== edge.targetHandle) {
        updateEdgeHandles(edge.id, newSourceHandle, newTargetHandle)
      }
    }
  }, [])

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={(instance) => { reactFlowInstance.current = instance }}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onNodeClick={onNodeClick}
          onNodeDrag={onNodeDrag}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          colorMode={isDark ? 'dark' : 'light'}
        >
          <Background
            variant="dots"
            gap={24}
            size={1}
            color={isDark ? 'rgba(0, 240, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}
          />
          <Controls />
        </ReactFlow>
        <AttackPathOverlay />
      </ReactFlowProvider>
    </div>
  )
}