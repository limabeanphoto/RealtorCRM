// Modern Responsive Hook - Enhanced breakpoint management
import { useState, useEffect, useCallback } from 'react';
import theme from '../styles/theme';

/**
 * Custom hook for modern responsive design with enhanced breakpoint management
 * Provides fine-grained control over responsive behavior across different screen sizes
 */
export function useModernResponsive() {
  const [screenSize, setScreenSize] = useState({
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLargeDesktop: false,
    orientation: 'portrait',
    aspectRatio: 1,
  });

  const [breakpoints, setBreakpoints] = useState({
    xs: false,
    sm: false,
    md: false,
    lg: false,
    xl: false,
    '2xl': false,
  });

  const [deviceCapabilities, setDeviceCapabilities] = useState({
    hasTouch: false,
    hasHover: false,
    prefersReducedMotion: false,
    prefersDarkMode: false,
    supportsContainerQueries: false,
    supportsViewportUnits: false,
  });

  // Debounced resize handler for better performance
  const updateScreenSize = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / height;

    // Parse theme breakpoints
    const breakpointValues = {
      xs: parseInt(theme.breakpoints.xs),
      sm: parseInt(theme.breakpoints.sm),
      md: parseInt(theme.breakpoints.md),
      lg: parseInt(theme.breakpoints.lg),
      xl: parseInt(theme.breakpoints.xl),
      '2xl': parseInt(theme.breakpoints['2xl']),
    };

    // Determine device categories
    const isMobile = width < breakpointValues.md;
    const isTablet = width >= breakpointValues.md && width < breakpointValues.lg;
    const isDesktop = width >= breakpointValues.lg && width < breakpointValues.xl;
    const isLargeDesktop = width >= breakpointValues.xl;

    // Determine orientation
    const orientation = width > height ? 'landscape' : 'portrait';

    // Update breakpoint states
    const newBreakpoints = {
      xs: width >= breakpointValues.xs,
      sm: width >= breakpointValues.sm,
      md: width >= breakpointValues.md,
      lg: width >= breakpointValues.lg,
      xl: width >= breakpointValues.xl,
      '2xl': width >= breakpointValues['2xl'],
    };

    // Detect device capabilities
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasHover = window.matchMedia('(hover: hover)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Feature detection
    const supportsContainerQueries = CSS.supports('container-type: inline-size');
    const supportsViewportUnits = CSS.supports('height: 100dvh');

    setScreenSize({
      width,
      height,
      isMobile,
      isTablet,
      isDesktop,
      isLargeDesktop,
      orientation,
      aspectRatio,
    });

    setBreakpoints(newBreakpoints);

    setDeviceCapabilities({
      hasTouch,
      hasHover,
      prefersReducedMotion,
      prefersDarkMode,
      supportsContainerQueries,
      supportsViewportUnits,
    });
  }, []);

  useEffect(() => {
    // Initialize on mount
    updateScreenSize();

    // Set up debounced resize listener
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScreenSize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', debouncedResize);

    // Listen for media query changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleMediaChange = () => {
      updateScreenSize();
    };

    reducedMotionQuery.addEventListener('change', handleMediaChange);
    darkModeQuery.addEventListener('change', handleMediaChange);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', debouncedResize);
      reducedMotionQuery.removeEventListener('change', handleMediaChange);
      darkModeQuery.removeEventListener('change', handleMediaChange);
    };
  }, [updateScreenSize]);

  // Helper functions for responsive behavior
  const getResponsiveValue = useCallback((values) => {
    const { mobile, tablet, desktop, largeDesktop } = values;
    
    if (screenSize.isLargeDesktop && largeDesktop !== undefined) return largeDesktop;
    if (screenSize.isDesktop && desktop !== undefined) return desktop;
    if (screenSize.isTablet && tablet !== undefined) return tablet;
    if (screenSize.isMobile && mobile !== undefined) return mobile;
    
    // Fallback to most appropriate value
    return largeDesktop || desktop || tablet || mobile;
  }, [screenSize]);

  const getBreakpointValue = useCallback((breakpointValues) => {
    const sortedBreakpoints = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
    
    for (const bp of sortedBreakpoints) {
      if (breakpoints[bp] && breakpointValues[bp] !== undefined) {
        return breakpointValues[bp];
      }
    }
    
    return breakpointValues.default || null;
  }, [breakpoints]);

  const isBreakpoint = useCallback((breakpointName) => {
    return breakpoints[breakpointName] || false;
  }, [breakpoints]);

  const isBetweenBreakpoints = useCallback((minBreakpoint, maxBreakpoint) => {
    const minWidth = parseInt(theme.breakpoints[minBreakpoint]);
    const maxWidth = parseInt(theme.breakpoints[maxBreakpoint]);
    return screenSize.width >= minWidth && screenSize.width < maxWidth;
  }, [screenSize.width]);

  // Generate responsive styles
  const getResponsiveStyles = useCallback((styles) => {
    const responsiveStyles = {};
    
    Object.entries(styles).forEach(([property, values]) => {
      if (typeof values === 'object' && values !== null) {
        responsiveStyles[property] = getResponsiveValue(values);
      } else {
        responsiveStyles[property] = values;
      }
    });
    
    return responsiveStyles;
  }, [getResponsiveValue]);

  // Container query helpers
  const getContainerStyles = useCallback((containerWidth) => {
    const width = containerWidth || screenSize.width;
    
    if (width < 320) {
      return {
        padding: theme.spacing[2],
        fontSize: theme.typography.fontSize.sm,
        gap: theme.spacing[2],
      };
    } else if (width < 768) {
      return {
        padding: theme.spacing[4],
        fontSize: theme.typography.fontSize.base,
        gap: theme.spacing[3],
      };
    } else {
      return {
        padding: theme.spacing[6],
        fontSize: theme.typography.fontSize.lg,
        gap: theme.spacing[4],
      };
    }
  }, [screenSize.width]);

  return {
    // Screen size information
    screenSize,
    breakpoints,
    deviceCapabilities,
    
    // Helper functions
    getResponsiveValue,
    getBreakpointValue,
    isBreakpoint,
    isBetweenBreakpoints,
    getResponsiveStyles,
    getContainerStyles,
    
    // Common responsive patterns
    isMobile: screenSize.isMobile,
    isTablet: screenSize.isTablet,
    isDesktop: screenSize.isDesktop,
    isLargeDesktop: screenSize.isLargeDesktop,
    
    // Device capabilities
    hasTouch: deviceCapabilities.hasTouch,
    hasHover: deviceCapabilities.hasHover,
    prefersReducedMotion: deviceCapabilities.prefersReducedMotion,
    prefersDarkMode: deviceCapabilities.prefersDarkMode,
    supportsContainerQueries: deviceCapabilities.supportsContainerQueries,
    supportsViewportUnits: deviceCapabilities.supportsViewportUnits,
  };
}

/**
 * Hook for container queries (when supported)
 */
export function useContainerQuery(ref) {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const updateSize = () => {
      if (ref.current) {
        setContainerSize({
          width: ref.current.offsetWidth,
          height: ref.current.offsetHeight,
        });
      }
    };

    // Use ResizeObserver for container size changes
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(ref.current);

    // Initial size
    updateSize();

    return () => {
      resizeObserver.disconnect();
    };
  }, [ref]);

  return containerSize;
}

/**
 * Hook for responsive font sizes using clamp()
 */
export function useResponsiveFontSize(minSize, preferredSize, maxSize) {
  return `clamp(${minSize}, ${preferredSize}, ${maxSize})`;
}

/**
 * Hook for responsive spacing using clamp()
 */
export function useResponsiveSpacing(minSpacing, preferredSpacing, maxSpacing) {
  return `clamp(${minSpacing}, ${preferredSpacing}, ${maxSpacing})`;
}

export default useModernResponsive;