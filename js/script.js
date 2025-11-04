$(function () {
  // =========================================================================
  //Smooth Scrollbar 초기화
  // =========================================================================
  const scrollContainer = document.querySelector("#scroll-container");

  // 오버스크롤 플러그인 등록
  Scrollbar.use(OverscrollPlugin);

  const scrollbar = Scrollbar.init(scrollContainer, {
    damping: 0.07,
    renderByPixels: true,
    alwaysShowTracks: false,
    plugins: {
      overscroll: {
        effect: "glow",
        damping: 0.07,
        maxOverscroll: 100,
        glowColor: "#e7e0d7ff",
      },
    },
  });

  //DOM에 thumb가 생성된 후 적용
  setTimeout(() => {
    const thumbY = scrollContainer.querySelector(".scrollbar-thumb-y");
    const trackY = scrollContainer.querySelector(".scrollbar-track-y");

    if (thumbY && trackY) {
      thumbY.style.backgroundColor = "#222";
      thumbY.style.width = "10px";
      thumbY.style.borderRadius = "10px";

      thumbY.style.minHeight = "100px";
      thumbY.style.maxHeight = "200px";

      trackY.style.backgroundColor = "rgba(249, 246, 243, 0.3)";
      trackY.style.width = "10px";
    }
  }, 50);

  // GSAP ScrollTrigger와 연동
  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.scrollerProxy("#scroll-container", {
    scrollTop(value) {
      if (arguments.length) {
        scrollbar.scrollTop = value;
      }
      return scrollbar.scrollTop;
    },
    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      };
    },
  });

  scrollbar.addListener(ScrollTrigger.update);

  // =========================================================================
  //a태그 상단이동 막기
  // =========================================================================
  document.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", (e) => {
      if (a.getAttribute("href").startsWith("#")) {
        e.preventDefault();
      }
    });
  });

  // =========================================================================
  //.menu-open
  // =========================================================================
  const menuButton = document.querySelector(".menu-button");
  const menuOpen = document.querySelector(".menu-open");
  const wrapper = document.querySelector(".fade-out-wrapper");

  let scrollY = 0; // 스크롤 위치 기억용

  let menuTimeline = gsap.timeline({
    paused: true,
    reversed: true,
    defaults: { ease: "power1.out" },
  });

  //메뉴 열릴 때
  menuTimeline
    .to(wrapper, { opacity: 0, duration: 0.5 })
    .set(wrapper, { visibility: "hidden" })
    .fromTo(
      menuOpen,
      { opacity: 0, visibility: "hidden" },
      { opacity: 1, visibility: "visible", duration: 0.6 },
      "<0.1"
    );

  //메뉴 닫힐 때 (reverse 시)
  menuTimeline.eventCallback("onReverseStart", () => {
    gsap.to(menuOpen, {
      opacity: 0,
      duration: 0.6,
      ease: "power1.out",
      onComplete: () => {
        menuOpen.style.visibility = "hidden";
        gsap.to(wrapper, {
          opacity: 1,
          duration: 0.5,
          ease: "power1.out",
          onStart: () => (wrapper.style.visibility = "visible"),
        });
      },
    });
  });

  // 메뉴 열릴 때 (onStart) → 스크롤 잠금
  menuTimeline.eventCallback("onStart", () => {
    menuButton.classList.add("active");
    document.body.classList.add("menu-opened");

    // 현재 스크롤 위치 기억 후 고정
    scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
  });

  // 메뉴 닫힐 때 (onReverseComplete) → 스크롤 복귀
  menuTimeline.eventCallback("onReverseComplete", () => {
    menuButton.classList.remove("active");
    document.body.classList.remove("menu-opened");

    // 원래 위치로 복귀
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, scrollY);
  });

  menuButton.addEventListener("click", () => {
    menuTimeline.reversed() ? menuTimeline.play() : menuTimeline.reverse();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menuTimeline.reversed()) {
      menuTimeline.reverse();
    }
  });

  // =========================================================================
  //#header.colored(헤더 섹션별로 텍스트, 로고 색상 변경)
  // =========================================================================

  $(function () {
    const header = document.querySelector("#header");
    const targetSections = document.querySelectorAll(
      ".visual, .about, .iconics, .subscribe"
    );
    const menuButton = document.querySelector(".menu-button");
    const menu = document.querySelector(".menu");
    let menuOpen = false;
    let observer;

    if (!header || !targetSections.length) return;

    //IntersectionObserver 생성 함수
    function createObserver() {
      observer = new IntersectionObserver(
        (entries) => {
          // 여러 섹션 중 하나라도 화면에 절반 이상 보이면 클래스 추가
          const anyVisible = entries.some((entry) => entry.isIntersecting);
          if (anyVisible) {
            header.classList.add("colored");
          } else {
            header.classList.remove("colored");
          }
        },
        { threshold: 0.5 }
      );

      targetSections.forEach((section) => observer.observe(section));
    }

    //초기 상태 체크
    function initialCheck() {
      const midY = window.innerHeight / 2;
      const anyAtMid = Array.from(targetSections).some((sec) => {
        const rect = sec.getBoundingClientRect();
        return rect.top <= midY && rect.bottom > midY;
      });

      if (anyAtMid) {
        header.classList.add("colored");
      } else {
        header.classList.remove("colored");
      }
    }

    // 초기 실행
    createObserver();
    initialCheck();
    $(window).on("resize", initialCheck);

    //메뉴 열기/닫기 제어
    menuButton.addEventListener("click", () => {
      menuOpen = !menuOpen;

      if (menuOpen) {
        // 메뉴 열릴 때: 감지 중단 + 클래스 제거
        if (observer) observer.disconnect();
        header.classList.remove("colored");
        header.classList.add("menu-active");
      } else {
        // 메뉴 닫힐 때: 다시 감지 시작 + 상태 재확인
        createObserver();
        initialCheck();
        header.classList.remove("menu-active");
      }
    });
  });

  //메인페이지,
  //서브페이지 분리

  const body = document.body;

  //메인페이지 전용
  if (body.classList.contains("page-main")) {
    // =========================================================================
    //.visual swiper
    // =========================================================================

    const delay = 4000; // 슬라이드 시간(ms)

    const swiper = new Swiper(".visual-swiper", {
      pagination: {
        el: ".swiper-pagination",
        type: "progressbar",
      },
      loop: true,
      autoplay: {
        delay: delay,
        disableOnInteraction: false,
      },
      speed: 600,
      effect: "fade",
    });

    // =========================================================================
    //.about scrolltrigger
    // =========================================================================

    gsap.registerPlugin(ScrollTrigger);

    let hasAnimated = false;
    const video = document.querySelector(".about-video");
    const aboutDim = document.querySelector(".about-dim");
    const aboutMorePath = document.querySelector(".about-more-icon");
    const texts = document.querySelectorAll(
      ".about h2, .about strong,.about p"
    );

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".about",
        scroller: "#scroll-container",
        start: "bottom bottom",
        end: "+=380%",
        pin: true,
      },
    });

    tl.to({}, { duration: 0.6 })
      .to(
        video,
        {
          width: "100vw",
          height: "100vh",
          filter: "grayscale(0%)",
          duration: 1,
          ease: "power2.out",
        },
        ">"
      )

      .to(
        aboutDim,
        {
          width: "100vw",
          height: "100vh",
          duration: 1,
          ease: "power2.out",
        },
        "<"
      )
      .to(
        texts,
        {
          color: "#f9f6f3",
          duration: 0.8,
          ease: "power2.out",
        },
        "<"
      )
      .to(
        aboutMorePath,
        {
          opacity: 1,
          duration: 0.9,
          ease: "power2.out",
        },
        "<=+0.2"
      )
      .to({}, { duration: 0.6 }, ">");

    // ===========================================================
    //.scent circle-con
    // ===========================================================

    gsap.registerPlugin(ScrollTrigger);

    const container = document.querySelector(".circle-container");
    const items = gsap.utils.toArray(".circle-item");
    const totalCount = items.length;
    const path = document.querySelector("#circlePath");
    const pathLength = path.getTotalLength();
    const scentTitle = document.querySelector(".scent-title");
    const scentPathL = document.querySelector(".scent-title-path-l path");
    const scentPathR = document.querySelector(".scent-title-path-r path");

    // 초기 path 세팅
    [scentPathL, scentPathR].forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });

    // Title timeline
    const titleTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".scent-title",
        scroller: "#scroll-container",
        start: "top top",
        toggleActions: "play none none none",
      },
    });

    titleTl
      .to(scentTitle, { opacity: 1, duration: 1 }, 0)
      .to(scentPathL, { strokeDashoffset: 0, duration: 1.5 }, 0)
      .to(scentPathR, { strokeDashoffset: 0, duration: 1.5 }, 0);

    // Main timeline
    const mainTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".scent",
        scroller: "#scroll-container",
        start: "top top",
        end: "+=1400%",
        scrub: 2.4,
        pin: true,
      },
    });

    const initialAngleDeg = 90;
    const angleOffset = initialAngleDeg / 360;
    const topOffsetY = 50; //탑에 도달하기 전 미리 클래스 적용할 Y값

    //퍼짐 애니메이션
    const spreadTween = gsap.timeline();
    items.forEach((item, i) => {
      const boxW = container.offsetWidth;
      const boxH = container.offsetHeight;
      const initialOffset = i / totalCount;
      const startOffset = 0.5;

      const targetProgress = (initialOffset + startOffset + angleOffset) % 1;
      const targetPoint = path.getPointAtLength(pathLength * targetProgress);
      const targetX = (targetPoint.x / 100) * boxW;
      const targetY = (targetPoint.y / 100) * boxH;

      spreadTween.fromTo(
        item,
        {
          left: boxW / 2 + "px",
          top: boxH * 0.95 + "px",
          transform: "translate(-50%, -50%)",
        },
        {
          duration: 1.4,
          left: targetX + "px",
          top: targetY + "px",
          opacity: 1,
          ease: "power3.out",
        },
        0
      );
    });

    // 메인 타임라인에 퍼짐 추가
    mainTl.add(spreadTween, 0);

    // 회전 애니메이션
    const rotateTween = gsap.to(
      {},
      {
        duration: 5,
        onStart: () => container.classList.add("rotating"),
        onReverseComplete: () => container.classList.remove("rotating"),
        onComplete: () => container.classList.remove("rotating"),
        onUpdate: function () {
          let minY = Infinity;
          let currentTopItem = null;

          // 퍼짐 중에는 회전 멈추게
          const t = mainTl.time();
          if (t >= spreadTween.startTime() && t <= spreadTween.endTime())
            return;

          items.forEach((item, i) => {
            const boxW = container.offsetWidth;
            const boxH = container.offsetHeight;
            const initialOffset = i / totalCount;
            const startOffset = 0.5;
            const itemProgress =
              (initialOffset -
                this.progress() +
                startOffset +
                angleOffset +
                1) %
              1;
            const point = path.getPointAtLength(pathLength * itemProgress);
            const x = (point.x / 100) * boxW;
            const y = (point.y / 100) * boxH;

            item.style.left = x + "px";
            item.style.top = y + "px";
            item.style.transform = "translate(-50%, -50%)";

            // topOffsetY를 고려해 조금 전에 top-item으로 인식
            if (y < minY + topOffsetY) {
              minY = y;
              currentTopItem = item;
            }
          });

          // top-item 클래스 제어 (리플로우 포함)
          if (
            rotateTween.lastTopItem &&
            rotateTween.lastTopItem !== currentTopItem
          ) {
            rotateTween.lastTopItem.classList.remove("top-item");
          }

          if (currentTopItem && currentTopItem !== rotateTween.lastTopItem) {
            currentTopItem.classList.remove("top-item");
            void currentTopItem.offsetWidth; //강제 리플로우
            currentTopItem.classList.add("top-item");
            rotateTween.lastTopItem = currentTopItem;
          }
        },
      }
    );

    // 메인 타임라인에 회전 추가
    mainTl.add(rotateTween, ">");

    // 퍼짐 구간 감지: 리버스 퍼짐일 때만 top-item 클래스 제거
    mainTl.eventCallback("onUpdate", () => {
      const t = mainTl.time();
      const inSpread =
        t >= spreadTween.startTime() && t <= spreadTween.endTime();
      const isReversed =
        mainTl.scrollTrigger && mainTl.scrollTrigger.direction === -1;

      if (isReversed && inSpread) {
        container.classList.remove("rotating");
        rotateTween.lastTopItem?.classList.remove("top-item");
      }
    });

    // 다음 섹션으로 넘어갈때 페이드아웃
    mainTl
      .to(scentTitle, { opacity: 0, duration: 0.2, ease: "power2.inOut" }, ">")
      .to(scentPathL, { opacity: 0, duration: 0.2, ease: "power2.inOut" }, "<")
      .to(scentPathR, { opacity: 0, duration: 0.2, ease: "power2.inOut" }, "<")
      .to(items, { opacity: 0, duration: 0.2, ease: "power2.inOut" }, "<")
      .to({}, { duration: 0.3, ease: "power2.inOut" }, ">+=0.5");

    // ========================================================================
    //.best best-wrap con
    // ========================================================================

    gsap.registerPlugin(ScrollTrigger);
    const bestTitle = document.querySelector(".best-text h2");
    const bestList = document.querySelector(".best-list");
    const leftSlide = document.querySelector(".left-side");
    const rightSlide = document.querySelector(".right-side");

    // 슬라이드 시작 시 보이도록 설정
    gsap.set([leftSlide, rightSlide], { visibility: "visible" });

    const slideTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".best",
        scroller: "#scroll-container",
        start: "top top",
        end: "+=800%",
        scrub: 2,
        pin: true,
        anticipatePin: 1,
      },
    });

    slideTl.fromTo(
      bestTitle,
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: 0.1, ease: "power2.out" }
    );

    slideTl.fromTo(
      bestList,
      { opacity: 0 },
      { opacity: 1, duration: 0.1, ease: "power2.out" },
      "<"
    );

    // 왼쪽 슬라이드
    slideTl.fromTo(
      leftSlide,
      { yPercent: -80 },
      { yPercent: 110, duration: 2, ease: "power1.out" },
      ">"
    );

    // 오른쪽 슬라이드
    slideTl.fromTo(
      rightSlide,
      { yPercent: 80 },
      { yPercent: -100, duration: 2, ease: "power1.out" },
      "<"
    );

    // =======================================================================
    //.iconic swiper con
    // =======================================================================

    gsap.registerPlugin(ScrollTrigger);

    const iconPn = ["FRESIA", "ROSA GARDENIA", "POTPOURRI", "TABACO TOSCANO"];
    const totalSlides = iconPn.length;

    const iconicSwiper = new Swiper(".iconic-swiper", {
      effect: "fade",
      allowTouchMove: false,
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
        renderBullet: (index, className) =>
          `<span class="${className}">${iconPn[index]}</span>`,
      },
    });

    // 초기에는 슬라이드 숨김
    gsap.set(".iconic-swiper .slide-item, .iconic-swiper .iconic-more-icon", {
      opacity: 0,
    });

    // ScrollTrigger + pin + snap 유지
    const iconicsTrigger = ScrollTrigger.create({
      trigger: ".iconics",
      scroller: "#scroll-container",
      start: "top top",
      end: "+=" + totalSlides * window.innerHeight,
      pin: true,

      snap: (progress) => {
        const step = 1 / (totalSlides - 1);
      },

      onUpdate: (self) => {
        const slideIndex = Math.floor(self.progress * totalSlides);

        //이미 activeIndex인 경우는 slideTo 호출x
        if (
          slideIndex >= 0 &&
          slideIndex < iconicSwiper.slides.length &&
          slideIndex !== iconicSwiper.activeIndex
        ) {
          iconicSwiper.slideTo(slideIndex, 0);
          animateSlide(iconicSwiper.slides[slideIndex]);
          updatePagination(slideIndex);
        }
      },

      onEnter: () => {
        animateSlide(iconicSwiper.slides[0]);
        updatePagination(0);
      },

      onLeaveBack: () => {
        resetSlides();
      },
    });

    //페이지네이션 클릭 시 연동 유지
    iconicSwiper.pagination.el.addEventListener("click", (e) => {
      const bullets = Array.from(iconicSwiper.pagination.bullets);
      const targetBullet = e.target.closest(
        ".iconic-swiper .swiper-pagination-bullet"
      );
      const index = bullets.indexOf(targetBullet);

      if (index >= 0) {
        // 클릭한 것만 active, 나머지는 자동으로 제거
        bullets.forEach((b, i) =>
          b.classList.toggle("swiper-pagination-bullet-active", i === index)
        );

        // 스크롤 위치 연동
        const jumpScroll =
          iconicsTrigger.start +
          (index / (totalSlides - 1)) *
            (iconicsTrigger.end - iconicsTrigger.start);
        iconicsTrigger.scroll(jumpScroll, false);

        iconicSwiper.slideTo(index, 0);

        if (iconicSwiper.slides[index])
          animateSlide(iconicSwiper.slides[index]);
      }
    });

    //pagination active 업데이트
    function updatePagination(index) {
      iconicSwiper.pagination.bullets.forEach((b, i) =>
        b.classList.toggle("swiper-pagination-bullet-active", i === index)
      );
    }

    //animateSlide 함수
    function animateSlide(slide) {
      if (!slide) return;

      const mainTargets = slide.querySelectorAll(".slide-item, .slide-info");
      const moreIcon = slide.querySelectorAll(".iconic-more-icon");

      // 강제로 0 세팅
      gsap.set(mainTargets, { opacity: 0 });
      gsap.set(moreIcon, { opacity: 0 });

      // 0 -> 1로 애니메이션
      gsap.to(mainTargets, {
        opacity: 1,
        duration: 1,
        ease: "power2.out",
        stagger: 0.1,
      });

      gsap.to(moreIcon, {
        opacity: 1,
        duration: 0.8,
        ease: "power1.out",
        delay: 0.3,
      });
    }
    //초기화 함수(섹션 위로 벗어날때 아이템들 자연스럽게 페이드아웃 되도록)
    function resetSlides() {
      iconicSwiper.slides.forEach((slide) => {
        const targets = slide.querySelectorAll(
          ".slide-item, .iconic-more-icon"
        );

        // 진행 중인 애니메이션 종료
        gsap.killTweensOf(targets);

        gsap.to(targets, {
          opacity: 0,
          duration: 0.6,
          ease: "power1.out",
        });
      });
    }

    // ====================================================================
    //.boutiques
    // ====================================================================

    const hoverImageWrap = document.querySelector(".hover-image-wrap");
    const hoverImage = document.querySelector(".hover-image");
    const bItems = document.querySelectorAll(".hover-text a");

    let activeImg = null; // 현재 활성화된 이미지

    bItems.forEach((item) => {
      item.addEventListener("mouseenter", (e) => {
        const imgSrc = e.currentTarget.dataset.img;
        activeImg = imgSrc;
        hoverImage.src = imgSrc;
        hoverImageWrap.style.opacity = 0.8;
      });

      item.addEventListener("mouseleave", () => {
        activeImg = null;
        hoverImageWrap.style.opacity = 0;
      });
    });

    window.addEventListener("mousemove", (e) => {
      if (!activeImg) return;
      hoverImageWrap.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
    });

    bItems.forEach((item, i) => {
      gsap.from(item, {
        y: 20,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        delay: Math.random() * 0.2,
        scrollTrigger: {
          trigger: item,
          scroller: "#scroll-container",
          start: "top 75%",
          toggleActions: "play none none none",
        },
      });
    });

    // ======================================================================
    //.subscribe
    // ======================================================================

    const sstl = gsap.timeline({
      scrollTrigger: {
        trigger: ".subscribe",
        scroller: "#scroll-container",
        start: "top top",
        end: "+=250%",
        pin: true,
        scrub: false,
        toggleActions: "play none none none",
      },
    });

    sstl
      .fromTo(
        ".subscribe-bg img",
        { scale: 1 },
        { scale: 1.06, duration: 0.8, delay: 0.2, ease: "power2.out" }
      )
      .fromTo(
        ".subscribe-dim",
        { scale: 1 },
        { scale: 1.06, duration: 0.8, delay: 0.2, ease: "power2.out" },
        "<"
      )
      .fromTo(
        ".subscribe-title h2",
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" },
        "<+=0.2"
      )
      .fromTo(
        ".subscribe-title p",
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" },
        "<"
      )
      .fromTo(
        ".email-form",
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "power3.out" },
        ">"
      );

    // =====================================================================
    //custom cursor(섹션 .about과 ,.boutiques 용)
    // =====================================================================
    const cursor = document.querySelector(".custom-cursor");
    let inSection = false;
    let hoveringItem = false;

    let mouseX = 0,
      mouseY = 0;
    let currentX = 0,
      currentY = 0;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animate() {
      currentX += (mouseX - currentX) * 0.6;
      currentY += (mouseY - currentY) * 0.6;

      const scale = inSection && !hoveringItem ? 1 : 0.9;
      cursor.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%) scale(${scale})`;

      requestAnimationFrame(animate);
    }
    animate();

    const sections = [
      { el: document.querySelector(".best"), itemSelector: ".best-item" },
      {
        el: document.querySelector(".boutiques"),
        itemSelector: ".location-box",
      },
    ];

    // 섹션 진입 감지
    sections.forEach((section) => {
      let enterTimeout;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // 섹션 진입하면 약간 딜레이 후 커스텀 커서 등장하게
              enterTimeout = setTimeout(() => {
                inSection = true;
                cursor.textContent = entry.target.dataset.cursorText || "";
                cursor.classList.add("active");
                document.body.style.cursor = "none";
              }, 300);
            } else {
              clearTimeout(enterTimeout);
              inSection = false;
              if (!hoveringItem) {
                cursor.classList.remove("active");
                document.body.style.cursor = "auto";
              }
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(section.el);

      // 섹션속 아이템 hover할때는 커스텀커서x 기존 커서o
      const sectionItems = section.el.querySelectorAll(section.itemSelector);
      sectionItems.forEach((item) => {
        item.addEventListener("mouseenter", () => {
          hoveringItem = true;
          cursor.classList.remove("active");
          document.body.style.cursor = "auto";
        });
        item.addEventListener("mouseleave", () => {
          hoveringItem = false;
          if (inSection) {
            cursor.classList.add("active");
            document.body.style.cursor = "none";
          }
        });
      });
    });

    // 메인 끝
  }

  //서브페이지 전용
  if (body.classList.contains("page-sub")) {
    // ===========================================================
    //.filter-container
    // ===========================================================
    const customSelect = document.querySelector(".custom-select");
    const selected = customSelect.querySelector(".selected");
    const arrow = selected.querySelector(".arrow");
    const options = customSelect.querySelector(".options");
    const optionItems = options.querySelectorAll("li");

    // 열기
    function openOptions() {
      const currentValue = selected.firstChild.textContent.trim();
      optionItems.forEach((item) => {
        item.style.display =
          item.textContent === currentValue ? "none" : "block";
      });

      options.classList.add("show");
      arrow.classList.add("up");
    }

    // 닫기
    function closeOptions() {
      options.classList.remove("show");
      arrow.classList.remove("up");
    }

    // 선택 박스 클릭
    selected.addEventListener("click", () => {
      if (options.classList.contains("show")) {
        closeOptions();
      } else {
        openOptions();
      }
    });

    // 옵션 클릭
    optionItems.forEach((item) => {
      item.addEventListener("click", () => {
        selected.firstChild.textContent = item.textContent;
        closeOptions();
        console.log("Selected value:", item.dataset.value);
      });
    });

    // 외부 클릭 시 닫기
    document.addEventListener("click", (e) => {
      if (!customSelect.contains(e.target)) {
        closeOptions();
      }
    });

    // ===========================================================
    //.item-wrap 스크롤에 따라 올라오게
    // ===========================================================

    const adTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".sub-ad-con",
        scroller: "#scroll-container",
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });

    adTimeline.fromTo(
      ".sub-ad-con .ad-img",
      { opacity: 0, scale: 1.02 },
      { opacity: 1, scale: 1, duration: 2, ease: "power3.out" },
      0
    );

    adTimeline.fromTo(
      ".sub-ad-con .ad-info",
      { opacity: 0, x: -50 },
      { opacity: 1, x: 0, duration: 1, ease: "power3.out" },
      0.4
    );

    gsap.registerPlugin(ScrollTrigger);

    //스크롤 애니메이션 함수
    function animateListItems(selector = ".item-list li") {
      const items = gsap.utils.toArray(selector);

      // li 6,7은 따로 그룹 처리(같이 올라오게)
      items.forEach((item, index) => {
        if (index === 5 || index === 6) return;

        gsap.fromTo(
          item,
          { opacity: 0, y: "+=20" },
          {
            opacity: 1,
            y: "-=20",
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: item,
              scroller: "#scroll-container",
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      gsap.fromTo(
        `${selector}:nth-child(6), ${selector}:nth-child(7)`,
        { opacity: 0, y: "+=20" },
        {
          opacity: 1,
          y: "-=20",
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: `${selector}:nth-child(7)`,
            scroller: "#scroll-container",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }

    //초기 list-top 실행
    animateListItems(".list-top li");

    //"load-more" 버튼 클릭 시
    const loadMoreBtn = document.querySelector(".load-more");
    const listBottom = document.querySelector(".list-bottom");

    gsap.set(listBottom, { autoAlpha: 0, display: "none" });

    loadMoreBtn.addEventListener("click", () => {
      gsap.set(listBottom, { display: "grid" });
      gsap.to(listBottom, {
        autoAlpha: 1,
        duration: 0.4,
        ease: "power2.out",
      });

      // 약간의 지연 후 애니메이션 적용
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        animateListItems(".list-bottom li");
      });

      // 버튼 비활성화
      loadMoreBtn.style.display = "none";
      loadMoreBtn.style.pointerEvents = "none";
    });

    //.view-more-ad 호버시 애니메이션
    const btn = document.querySelector(".view-more-ad");
    const adArrow = document.querySelector(".ad-arr");
    const text = document.querySelector(".change-txt");

    // transition 시간
    const ARROW_HIDE_MS = 400; // 화살표 사라짐
    const TEXT_SHOW_MS = 600; // 텍스트 등장
    const TEXT_HIDE_MS = 600; // 텍스트 사라짐

    btn.addEventListener("mouseenter", () => {
      // 초기화
      adArrow.classList.remove("pre-left", "return", "no-tr");
      text.classList.remove("text-pre", "exit", "no-tr", "visible");

      // 1️.화살표 오른쪽으로 사라짐
      adArrow.classList.add("change-to");

      // 2️.화살표 사라진 후 → 왼쪽(-10px)으로 순간이동 + 텍스트 등장 시작
      clearTimeout(adArrow._prepTimeout);
      adArrow._prepTimeout = setTimeout(() => {
        // 화살표 순간이동
        adArrow.classList.add("no-tr");
        adArrow.classList.remove("change-to");
        adArrow.classList.add("pre-left");
        adArrow.offsetHeight;
        adArrow.classList.remove("no-tr");

        //화살표가 완전히 사라지고 나서 텍스트 등장
        text.classList.add("visible");
      }, ARROW_HIDE_MS);
    });

    btn.addEventListener("mouseleave", () => {
      // 1️.텍스트 오른쪽으로 사라짐
      text.classList.add("exit");
      text.classList.remove("visible");

      // 2️.텍스트 완전히 사라진 뒤 → 텍스트를 왼쪽(-20px)으로 미리 이동 + 화살표 복귀
      clearTimeout(text._prepTimeout);
      text._prepTimeout = setTimeout(() => {
        // 텍스트 숨김 후 다음 준비 위치로 이동
        text.classList.add("no-tr");
        text.classList.remove("exit");
        text.classList.add("text-pre");
        text.offsetHeight;
        text.classList.remove("no-tr");

        //텍스트 사라진 다음 화살표 복귀
        adArrow.classList.remove("pre-left");
        void adArrow.offsetWidth;
        adArrow.classList.add("return");
      }, TEXT_HIDE_MS);
    });
  }
});
