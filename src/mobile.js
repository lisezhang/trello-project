// -------------------------
// Mobile Keyboard Detection & Modal Adjustment
// -------------------------

/**
 * Initialize mobile keyboard handler for modal adjustment
 * Handles iOS Safari and Android keyboard behavior
 */
export function initMobileKeyboardHandler() {
  // Only run on mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (!isMobile) return;

  const modals = document.querySelectorAll('.modal');
  let initialViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  let keyboardOpen = false;
  let lastFocusedElement = null;
  let isScrollingProgrammatically = false;

  // Set initial CSS custom property for viewport height
  updateViewportHeight();

  // Use visualViewport API if available (better support on iOS/Android)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportResize);
    window.visualViewport.addEventListener('scroll', handleViewportScroll);
  } else {
    // Fallback for older browsers
    window.addEventListener('resize', handleWindowResize);
  }

  function updateViewportHeight() {
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const offsetTop = window.visualViewport ? window.visualViewport.offsetTop : 0;

    document.documentElement.style.setProperty('--visual-viewport-height', `${vh}px`);
    document.documentElement.style.setProperty('--visual-viewport-offset', `${offsetTop}px`);

    // Calculate keyboard height more accurately
    // On iOS, we need to account for the offset as well
    const keyboardHeight = Math.max(0, initialViewportHeight - vh - offsetTop);
    document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
  }

  function handleViewportResize() {
    const currentHeight = window.visualViewport.height;
    const heightDiff = initialViewportHeight - currentHeight;

    // Update CSS custom property in real-time
    updateViewportHeight();

    // Keyboard is considered open if height reduced by more than 150px
    const isKeyboardNowOpen = heightDiff > 150;

    if (isKeyboardNowOpen !== keyboardOpen) {
      keyboardOpen = isKeyboardNowOpen;
      handleKeyboardChange(keyboardOpen);
    }
  }

  function handleViewportScroll() {
    // Update viewport height on iOS scroll (iOS moves viewport when keyboard opens)
    updateViewportHeight();
  }

  function handleWindowResize() {
    const currentHeight = window.innerHeight;
    const heightDiff = initialViewportHeight - currentHeight;

    updateViewportHeight();

    const isKeyboardNowOpen = heightDiff > 150;

    if (isKeyboardNowOpen !== keyboardOpen) {
      keyboardOpen = isKeyboardNowOpen;
      handleKeyboardChange(keyboardOpen);
    }
  }

  function handleKeyboardChange(isOpen) {
    // When keyboard closes, preserve scroll position of the open modal
    const openModal = document.querySelector('.modal.show');
    let savedScrollTop = null;

    if (!isOpen && openModal) {
      // Save current scroll position before any CSS changes
      savedScrollTop = openModal.scrollTop;
    }

    modals.forEach(modal => {
      if (isOpen) {
        modal.classList.add('keyboard-open');
        // Force body to not scroll
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      } else {
        modal.classList.remove('keyboard-open');
        // Restore body scroll only if no modal is open
        const anyModalOpen = document.querySelector('.modal.show');
        if (!anyModalOpen) {
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
        }
      }
    });

    // When keyboard closes, restore scroll position after layout recalculation
    if (!isOpen && openModal && savedScrollTop !== null) {
      // Use requestAnimationFrame to wait for CSS changes to apply
      requestAnimationFrame(() => {
        // Double RAF to ensure layout is complete
        requestAnimationFrame(() => {
          // Temporarily disable smooth scrolling to restore position instantly
          const originalScrollBehavior = openModal.style.scrollBehavior;
          openModal.style.scrollBehavior = 'auto';
          openModal.scrollTop = savedScrollTop;
          // Restore original scroll behavior after a brief delay
          setTimeout(() => {
            openModal.style.scrollBehavior = originalScrollBehavior;
          }, 50);
        });
      });
    }

    // When keyboard opens, ensure focused element is visible (gentle scroll)
    if (isOpen && lastFocusedElement) {
      ensureElementVisible(lastFocusedElement);
    }
  }

  function ensureElementVisible(element) {
    // Find the open modal
    const openModal = document.querySelector('.modal.show');
    if (!openModal) return;

    // Delay to allow keyboard animation to complete
    setTimeout(() => {
      if (isScrollingProgrammatically) return;

      const elementRect = element.getBoundingClientRect();
      const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

      // Check if element is already visible in the viewport
      // We want the element to be in the middle third of the visible area
      const visibleTop = viewportHeight * 0.2;
      const visibleBottom = viewportHeight * 0.7;

      if (elementRect.top >= visibleTop && elementRect.bottom <= visibleBottom) {
        // Element is already well-positioned, no scroll needed
        return;
      }

      // Calculate minimal scroll to make element visible
      // Prefer scrolling just enough to show the element, not centering aggressively
      const modalContent = openModal.querySelector('.modal-content');
      if (!modalContent) return;

      let scrollAdjustment = 0;

      if (elementRect.top < visibleTop) {
        // Element is above visible area - scroll up (reduce scrollTop)
        scrollAdjustment = elementRect.top - visibleTop;
      } else if (elementRect.bottom > visibleBottom) {
        // Element is below visible area - scroll down (increase scrollTop)
        scrollAdjustment = elementRect.bottom - visibleBottom;
      }

      if (Math.abs(scrollAdjustment) > 20) {
        isScrollingProgrammatically = true;
        openModal.scrollBy({
          top: scrollAdjustment,
          behavior: 'smooth'
        });

        // Reset flag after scroll animation
        setTimeout(() => {
          isScrollingProgrammatically = false;
        }, 400);
      }
    }, 300);
  }

  // Handle focus events on inputs
  document.addEventListener('focusin', (e) => {
    const target = e.target;
    const isInput = target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.tagName === 'SELECT';

    if (!isInput) return;

    const openModal = document.querySelector('.modal.show');
    if (!openModal) return;

    lastFocusedElement = target;

    // Only scroll if keyboard is already open
    // This prevents jumping when first focusing
    if (keyboardOpen) {
      ensureElementVisible(target);
    }
  });

  // Handle blur to reset tracking
  document.addEventListener('focusout', (e) => {
    // Small delay to check if focus moved to another input
    setTimeout(() => {
      const activeElement = document.activeElement;
      const isStillInInput = activeElement &&
        (activeElement.tagName === 'INPUT' ||
         activeElement.tagName === 'TEXTAREA' ||
         activeElement.tagName === 'SELECT');

      if (!isStillInInput) {
        lastFocusedElement = null;
      }
    }, 100);
  });

  // Update initial height on orientation change
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      initialViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      updateViewportHeight();
      // Reset keyboard state after orientation change
      keyboardOpen = false;
      modals.forEach(modal => modal.classList.remove('keyboard-open'));
    }, 500);
  });

  // Also update on page visibility change (when returning to the page)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      setTimeout(() => {
        initialViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        updateViewportHeight();
      }, 300);
    }
  });

  // Recalculate initial height when modal opens
  // This helps when the page was loaded with address bar visible
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target;
        if (target.classList.contains('modal') && target.classList.contains('show')) {
          // Modal just opened - reset scroll to top
          target.scrollTop = 0;

          // Recalculate initial height if keyboard is closed
          if (!keyboardOpen) {
            setTimeout(() => {
              initialViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
              updateViewportHeight();
            }, 100);
          }
        }
      }
    });
  });

  modals.forEach(modal => {
    observer.observe(modal, { attributes: true });
  });
}
