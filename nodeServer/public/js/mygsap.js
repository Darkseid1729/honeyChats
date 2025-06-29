document.addEventListener('DOMContentLoaded', function () {
    const container = document.querySelector('.container');
    if (!container) return;

    // Animate new messages as before
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (
                    node.nodeType === 1 &&
                    node.classList.contains('message-wrapper')
                ) {
                    node.classList.add('gsap-pop-in');
                    gsap.fromTo(node,
                        {
                            opacity: 0,
                            x: node.classList.contains('right') ? 90 : -90,
                            transformOrigin: node.classList.contains('right') ? '100% 50%' : '0% 50%',
                        },
                        {
                            opacity: 1,
                            x: 0,
                            duration: 0.5,
                            ease: "back.out(1.5)",
                            clearProps: "all",
                            onComplete: () => node.classList.remove('gsap-pop-in')
                        }
                    );
                }
            });
        });
    });

    observer.observe(container, { childList: true });

    // Animate container on scroll (e.g., subtle scale and shadow)
    let ticking = false;

    function animateOnScroll() {
        gsap.to(container, {
            scale: 0.985,
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18), 0 0 24px 4px #4caf50",
            duration: 0.18,
            overwrite: true
        });
        clearTimeout(container._scrollAnimTimeout);
        container._scrollAnimTimeout = setTimeout(() => {
            gsap.to(container, {
                scale: 1,
                boxShadow: "",
                duration: 0.25,
                overwrite: true
            });
        }, 220);
    }

    container.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                animateOnScroll();
                ticking = false;
            });
            ticking = true;
        }
    });

    // Animate messages when they enter viewport using ScrollTrigger and stagger
    if (window.ScrollTrigger && gsap) {
        gsap.registerPlugin(ScrollTrigger);

        function setupScrollTriggers() {
            const nodes = Array.from(document.querySelectorAll('.message-wrapper'));
            // Remove previous triggers to avoid duplicates
            ScrollTrigger.getAll().forEach(trigger => {
                if (trigger.vars && trigger.vars.trigger && trigger.vars.trigger.classList && trigger.vars.trigger.classList.contains('message-wrapper')) {
                    trigger.kill();
                }
            });

            gsap.fromTo(
                nodes,
                {
                    opacity: 0.5,
                    y: 40,
                    scale: 0.98
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.35,
                    ease: "power2.out",
                    stagger: 0.07,
                    scrollTrigger: {
                        trigger: container,
                        start: "top bottom",
                        end: "bottom top",
                        scroller: container,
                        scrub: false,
                        onUpdate: self => {
                            // No-op, but required for ScrollTrigger to update
                        }
                    }
                }
            );

            // Also add individual triggers for hiding/showing on scroll
            nodes.forEach(node => {
                if (node._hasScrollTrigger) return;
                node._hasScrollTrigger = true;
                gsap.fromTo(node,
                    {
                        opacity: 0.5,
                        y: 40,
                        scale: 0.98
                    },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        duration: 0.35,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: node,
                            start: "top 95%",
                            end: "bottom 10%",
                            toggleActions: "play none none reverse",
                            scroller: container,
                            onLeave: self => {
                                gsap.to(node, { opacity: 0, y: 40, duration: 0.2, pointerEvents: "none" });
                            },
                            onEnterBack: self => {
                                gsap.to(node, { opacity: 1, y: 0, duration: 0.2, pointerEvents: "auto" });
                            }
                        }
                    }
                );
            });
        }

        // Initial setup
        setupScrollTriggers();

        // Re-run when new messages are added
        observer.observe(container, { childList: true, subtree: false });
        container.addEventListener('DOMNodeInserted', function (e) {
            if (e.target.classList && e.target.classList.contains('message-wrapper')) {
                setupScrollTriggers();
            }
        });

        // Optionally, keep ScrollTrigger logic for container shadow
        ScrollTrigger.create({
            trigger: container,
            start: "top top",
            end: "bottom bottom",
            onUpdate: self => {
                if (self.progress < 0.98) {
                    container.style.boxShadow = "0 8px 32px 0 rgba(31, 38, 135, 0.18), 0 0 16px 2px #64b5f6";
                } else {
                    container.style.boxShadow = "";
                }
            }
        });
    }
});
