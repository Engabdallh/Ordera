document.addEventListener(
  "DOMContentLoaded",
  () => {
    // =========================================
    // ELEMENTS
    // =========================================

    const searchInput =
      document.getElementById(
        "faqSearch",
      );

    const faqItems =
      document.querySelectorAll(
        ".faq-item",
      );

    const sections =
      document.querySelectorAll(
        ".faq-section",
      );

    const noResults =
      document.getElementById(
        "noResults",
      );


    // =========================================
    // OPEN / CLOSE FAQ
    // فتح وإغلاق السؤال
    // =========================================

    faqItems.forEach(
      (item) => {
        const question =
          item.querySelector(
            ".faq-question",
          );

        if (!question) {
          return;
        }

        question.addEventListener(
          "click",
          () => {
            const isOpen =
              item.classList.contains(
                "open",
              );

            // إغلاق جميع الأسئلة
            faqItems.forEach(
              (otherItem) => {
                otherItem.classList.remove(
                  "open",
                );
              },
            );

            // فتح السؤال المحدد
            if (!isOpen) {
              item.classList.add(
                "open",
              );
            }
          },
        );
      },
    );


    // =========================================
    // SEARCH
    // البحث داخل الأسئلة والأجوبة
    // =========================================

    if (!searchInput) {
      return;
    }

    searchInput.addEventListener(
      "input",
      () => {
        const search =
          searchInput.value
            .trim()
            .toLowerCase();

        let visibleCount = 0;


        faqItems.forEach(
          (item) => {
            const question =
              item
                .querySelector(
                  ".faq-question span",
                )
                ?.textContent
                ?.toLowerCase() || "";

            const answer =
              item
                .querySelector(
                  ".faq-answer",
                )
                ?.textContent
                ?.toLowerCase() || "";

            const keywords =
              (
                item.dataset.search ||
                ""
              ).toLowerCase();


            const matched =
              !search ||
              question.includes(
                search,
              ) ||
              answer.includes(
                search,
              ) ||
              keywords.includes(
                search,
              );


            item.style.display =
              matched
                ? ""
                : "none";


            if (matched) {
              visibleCount++;
            }

            // إذا أخفى البحث سؤالًا
            // نغلقه
            if (!matched) {
              item.classList.remove(
                "open",
              );
            }
          },
        );


        // =====================================
        // SHOW / HIDE SECTIONS
        // إخفاء الأقسام التي لا تحتوي نتائج
        // =====================================

        sections.forEach(
          (section) => {
            const visibleItems =
              Array.from(
                section.querySelectorAll(
                  ".faq-item",
                ),
              ).filter(
                (item) =>
                  item.style.display !==
                  "none",
              );

            section.style.display =
              visibleItems.length > 0
                ? ""
                : "none";
          },
        );


        // =====================================
        // NO RESULTS
        // =====================================

        if (noResults) {
          noResults.classList.toggle(
            "hidden",
            visibleCount > 0,
          );
        }
      },
    );
  },
);