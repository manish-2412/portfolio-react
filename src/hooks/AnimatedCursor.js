import React, { useState, useRef, useEffect, useCallback } from 'react';

// Utility to listen for events
function useEventListener(event, handler, element = document) {
  useEffect(() => {
    element.addEventListener(event, handler);
    return () => {
      element.removeEventListener(event, handler);
    };
  }, [event, handler, element]);
}

function CursorCore({
  outerStyle,
  innerStyle,
  color = '128, 128, 128', // Changed to grey (RGB: 128, 128, 128)
  outerAlpha = 0.3,
  innerSize = 8,
  outerSize = 8,
  outerScale = 6,
  innerScale = 0.6,
  trailingSpeed = 8,
  clickables = [
    'a',
    'input[type="text"]',
    'input[type="email"]',
    'input[type="number"]',
    'input[type="submit"]',
    'input[type="image"]',
    'label[for]',
    'select',
    'textarea',
    'button',
    '.link'
  ]
}) {
  const cursorOuterRef = useRef();
  const cursorInnerRef = useRef();
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true); // Ensure cursor is visible
  const [isActive, setIsActive] = useState(false);
  const [isActiveClickable, setIsActiveClickable] = useState(false);
  let endX = useRef(0);
  let endY = useRef(0);

  // Handle mouse movement
  const onMouseMove = useCallback(({ clientX, clientY }) => {
    setCoords({ x: clientX, y: clientY });
    cursorInnerRef.current.style.top = `${clientY}px`;
    cursorInnerRef.current.style.left = `${clientX}px`;
    endX.current = clientX;
    endY.current = clientY;
  }, []);

  // Animate the outer cursor movement
  const animateOuterCursor = useCallback(
    (time) => {
      coords.x += (endX.current - coords.x) / trailingSpeed;
      coords.y += (endY.current - coords.y) / trailingSpeed;
      cursorOuterRef.current.style.top = `${coords.y}px`;
      cursorOuterRef.current.style.left = `${coords.x}px`;
      requestAnimationFrame(animateOuterCursor);
    },
    [coords]
  );

  useEffect(() => {
    requestAnimationFrame(animateOuterCursor);
    return () => cancelAnimationFrame(requestAnimationFrame);
  }, [animateOuterCursor]);

  // Mouse down and up events
  const onMouseDown = useCallback(() => setIsActive(true), []);
  const onMouseUp = useCallback(() => setIsActive(false), []);
  const onMouseEnterViewport = useCallback(() => setIsVisible(true), []);
  const onMouseLeaveViewport = useCallback(() => setIsVisible(false), []);

  useEventListener('mousemove', onMouseMove);
  useEventListener('mousedown', onMouseDown);
  useEventListener('mouseup', onMouseUp);
  useEventListener('mouseover', onMouseEnterViewport);
  useEventListener('mouseout', onMouseLeaveViewport);

  // Handle scaling and transitions for the custom cursor
  useEffect(() => {
    if (isActive) {
      cursorInnerRef.current.style.transform = `translate(-50%, -50%) scale(${innerScale})`;
      cursorOuterRef.current.style.transform = `translate(-50%, -50%) scale(${outerScale})`;
    } else {
      cursorInnerRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
      cursorOuterRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
    }
  }, [innerScale, outerScale, isActive]);

  useEffect(() => {
    if (isActiveClickable) {
      cursorInnerRef.current.style.transform = `translate(-50%, -50%) scale(${innerScale * 1.2})`;
      cursorOuterRef.current.style.transform = `translate(-50%, -50%) scale(${outerScale * 1.4})`;
    }
  }, [innerScale, outerScale, isActiveClickable]);

  useEffect(() => {
    if (isVisible) {
      cursorInnerRef.current.style.opacity = 1;
      cursorOuterRef.current.style.opacity = 1;
    } else {
      cursorInnerRef.current.style.opacity = 0;
      cursorOuterRef.current.style.opacity = 0;
    }
  }, [isVisible]);

  useEffect(() => {
    const clickableEls = document.querySelectorAll(clickables.join(','));

    clickableEls.forEach((el) => {
      el.style.cursor = 'none'; // Hide default cursor on clickable elements

      el.addEventListener('mouseover', () => {
        setIsActive(true);
        setIsActiveClickable(true);
      });
      el.addEventListener('click', () => {
        setIsActive(true);
        setIsActiveClickable(false);
      });
      el.addEventListener('mousedown', () => {
        setIsActiveClickable(true);
      });
      el.addEventListener('mouseup', () => {
        setIsActive(true);
        setIsActiveClickable(false);
      });
      el.addEventListener('mouseout', () => {
        setIsActive(false);
        setIsActiveClickable(false);
      });
    });

    return () => {
      clickableEls.forEach((el) => {
        el.removeEventListener('mouseover', () => setIsActive(true));
        el.removeEventListener('click', () => setIsActive(true));
        el.removeEventListener('mousedown', () => setIsActiveClickable(true));
        el.removeEventListener('mouseup', () => setIsActive(true));
        el.removeEventListener('mouseout', () => setIsActive(false));
      });
    };
  }, [isActive, clickables]);

  // Styles for the custom cursor
  const styles = {
    cursorInner: {
      zIndex: 999,
      display: 'block',
      position: 'fixed',
      borderRadius: '50%',
      width: innerSize,
      height: innerSize,
      pointerEvents: 'none',
      backgroundColor: `rgba(${color}, 1)`, // Grey color
      ...(innerStyle && innerStyle),
      transition: 'opacity 0.15s ease-in-out, transform 0.25s ease-in-out',
    },
    cursorOuter: {
      zIndex: 999,
      display: 'block',
      position: 'fixed',
      borderRadius: '50%',
      pointerEvents: 'none',
      width: outerSize,
      height: outerSize,
      backgroundColor: `rgba(${color}, ${outerAlpha})`, // Grey color
      transition: 'opacity 0.15s ease-in-out, transform 0.15s ease-in-out',
      willChange: 'transform',
      ...(outerStyle && outerStyle),
    },
  };

  document.body.style.cursor = 'none'; // Hide default cursor globally

  return (
    <>
      <div ref={cursorOuterRef} style={styles.cursorOuter} />
      <div ref={cursorInnerRef} style={styles.cursorInner} />
    </>
  );
}

export default CursorCore;