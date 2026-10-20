import type { Modifier } from '@dnd-kit/core';

export const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

export const restrictToParentElement: Modifier = ({ transform, draggingNodeRect, containerNodeRect }) => {
  if (!draggingNodeRect || !containerNodeRect) return transform;
  const minY = containerNodeRect.top - draggingNodeRect.top;
  const maxY = containerNodeRect.bottom - draggingNodeRect.bottom;
  return { ...transform, y: Math.min(Math.max(transform.y, minY), maxY) };
};
