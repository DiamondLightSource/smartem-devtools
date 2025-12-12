import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { Tooltip } from '@mui/material'
import { webUiAppContents } from '~/config'
import type { Connection } from './connectionConfig'

interface ConnectionsOverlayProps {
  connections: Connection[]
  containerRef: RefObject<HTMLElement | null>
}

type AnchorPosition = 'left' | 'right' | 'top' | 'bottom'

// Get rotation angle for arrow based on anchor position (arrow points INTO the element)
function getArrowRotation(anchor: AnchorPosition): number {
  switch (anchor) {
    case 'left': return 180   // Arrow points left (into element from right)
    case 'right': return 0    // Arrow points right (into element from left)
    case 'top': return 270    // Arrow points up (into element from below)
    case 'bottom': return 90  // Arrow points down (into element from above)
  }
}

function getAnchorPoint(
  rect: DOMRect,
  anchor: AnchorPosition,
  containerRect: DOMRect,
  dotOffset = 0
): { x: number; y: number } {
  const relativeRect = {
    left: rect.left - containerRect.left,
    right: rect.right - containerRect.left,
    top: rect.top - containerRect.top,
    bottom: rect.bottom - containerRect.top,
    width: rect.width,
    height: rect.height,
  }

  // For left/right anchors, offset moves vertically (positive = down)
  // For top/bottom anchors, offset moves horizontally (positive = right)
  switch (anchor) {
    case 'left':
      return { x: relativeRect.left, y: relativeRect.top + relativeRect.height / 2 + dotOffset }
    case 'right':
      return { x: relativeRect.right, y: relativeRect.top + relativeRect.height / 2 + dotOffset }
    case 'top':
      return { x: relativeRect.left + relativeRect.width / 2 + dotOffset, y: relativeRect.top }
    case 'bottom':
      return { x: relativeRect.left + relativeRect.width / 2 + dotOffset, y: relativeRect.bottom }
  }
}

function renderPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  sourceAnchor: AnchorPosition,
  targetAnchor: AnchorPosition,
  style: 'straight' | 'bezier' | 'orthogonal',
  curveOffset = 40
): string {
  switch (style) {
    case 'straight':
      return `M ${x1} ${y1} L ${x2} ${y2}`
    case 'bezier': {
      // Calculate control point offsets based on anchor directions
      const offset = curveOffset

      // Determine control point directions based on anchors
      let cp1x = x1, cp1y = y1
      let cp2x = x2, cp2y = y2

      // Source control point - extend in the direction of the anchor
      switch (sourceAnchor) {
        case 'left': cp1x = x1 - offset; break
        case 'right': cp1x = x1 + offset; break
        case 'top': cp1y = y1 - offset; break
        case 'bottom': cp1y = y1 + offset; break
      }

      // Target control point - extend in the direction of the anchor
      switch (targetAnchor) {
        case 'left': cp2x = x2 - offset; break
        case 'right': cp2x = x2 + offset; break
        case 'top': cp2y = y2 - offset; break
        case 'bottom': cp2y = y2 + offset; break
      }

      return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`
    }
    case 'orthogonal': {
      const midX = (x1 + x2) / 2
      return `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`
    }
  }
}

export function ConnectionsOverlay({ connections, containerRef }: ConnectionsOverlayProps) {
  const [positions, setPositions] = useState<Map<string, DOMRect>>(new Map())
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)
  const [mounted, setMounted] = useState(false)

  const lineStyle = webUiAppContents.featureFlags?.connectionLineStyle ?? 'bezier'

  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  useLayoutEffect(() => {
    if (!mounted) return

    const updatePositions = () => {
      if (!containerRef.current) return

      const container = containerRef.current
      const newContainerRect = container.getBoundingClientRect()
      setContainerRect(newContainerRect)

      const newPositions = new Map<string, DOMRect>()
      const elements = container.querySelectorAll('[data-connection-id]')

      elements.forEach((el) => {
        const id = el.getAttribute('data-connection-id')
        if (id) {
          newPositions.set(id, el.getBoundingClientRect())
        }
      })

      setPositions(newPositions)
    }

    // Initial update with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(updatePositions, 0)

    observerRef.current = new ResizeObserver(() => {
      updatePositions()
    })

    if (containerRef.current) {
      observerRef.current.observe(containerRef.current)
    }

    window.addEventListener('scroll', updatePositions, true)
    window.addEventListener('resize', updatePositions)

    return () => {
      clearTimeout(timeoutId)
      observerRef.current?.disconnect()
      window.removeEventListener('scroll', updatePositions, true)
      window.removeEventListener('resize', updatePositions)
    }
  }, [containerRef, mounted])

  if (!containerRect) return null

  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 10,
        width: '100%',
        height: '100%',
      }}
    >
      {connections.map((conn) => {
        const sourceRect = positions.get(conn.sourceId)
        const targetRect = positions.get(conn.targetId)

        if (!sourceRect || !targetRect) return null

        const source = getAnchorPoint(sourceRect, conn.sourceAnchor, containerRect, conn.sourceDotOffset)
        const target = getAnchorPoint(targetRect, conn.targetAnchor, containerRect, conn.targetDotOffset)

        const pathD = renderPath(source.x, source.y, target.x, target.y, conn.sourceAnchor, conn.targetAnchor, lineStyle, conn.curveOffset)

        const showSourceArrow = conn.arrow === 'source' || conn.arrow === 'both'
        const showTargetArrow = conn.arrow === 'target' || conn.arrow === 'both'
        const sourceRotation = getArrowRotation(conn.sourceAnchor)
        const targetRotation = getArrowRotation(conn.targetAnchor)

        return (
          <g key={conn.id}>
            {/* Invisible wider path for easier hover */}
            <Tooltip title={conn.tooltip} arrow followCursor>
              <path
                d={pathD}
                stroke="transparent"
                strokeWidth={12}
                fill="none"
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
              />
            </Tooltip>
            {/* Visible path */}
            <path
              d={pathD}
              stroke={conn.color}
              strokeWidth={2}
              fill="none"
              style={{ pointerEvents: 'none' }}
            />
            {/* Source endpoint - arrow or circle */}
            {showSourceArrow ? (
              <polygon
                points="-6,-4 6,0 -6,4"
                fill={conn.color}
                transform={`translate(${source.x}, ${source.y}) rotate(${sourceRotation + 180})`}
                style={{ pointerEvents: 'none' }}
              />
            ) : (
              <circle
                cx={source.x}
                cy={source.y}
                r={5}
                fill={conn.color}
                style={{ pointerEvents: 'none' }}
              />
            )}
            {/* Target endpoint - arrow or circle */}
            {showTargetArrow ? (
              <polygon
                points="-6,-4 6,0 -6,4"
                fill={conn.color}
                transform={`translate(${target.x}, ${target.y}) rotate(${targetRotation + 180})`}
                style={{ pointerEvents: 'none' }}
              />
            ) : (
              <circle
                cx={target.x}
                cy={target.y}
                r={5}
                fill={conn.color}
                style={{ pointerEvents: 'none' }}
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}
