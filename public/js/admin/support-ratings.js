document.addEventListener(
  "DOMContentLoaded",
  () => {
    // =========================================
    // ELEMENTS
    // =========================================

    const employeeNameInput =
      document.getElementById(
        "employeeNameInput",
      );

    const searchEmployeeBtn =
      document.getElementById(
        "searchEmployeeBtn",
      );

    const message =
      document.getElementById(
        "message",
      );

    const employeeHeader =
      document.getElementById(
        "employeeHeader",
      );

    const employeeName =
      document.getElementById(
        "employeeName",
      );

    const averageRating =
      document.getElementById(
        "averageRating",
      );

    const averageStars =
      document.getElementById(
        "averageStars",
      );

    const statsGrid =
      document.getElementById(
        "statsGrid",
      );

    const contentGrid =
      document.getElementById(
        "contentGrid",
      );

    const totalAssigned =
      document.getElementById(
        "totalAssigned",
      );

    const respondedConversations =
      document.getElementById(
        "respondedConversations",
      );

    const totalMessages =
      document.getElementById(
        "totalMessages",
      );

    const responseRate =
      document.getElementById(
        "responseRate",
      );

    const ratingsContainer =
      document.getElementById(
        "ratingsContainer",
      );


    // =========================================
    // CREATE STARS
    // إنشاء النجوم
    // =========================================

    const createStars = (
      rating,
    ) => {
      const value =
        Math.max(
          0,
          Math.min(
            5,
            Number(rating || 0),
          ),
        );

      return (
        "★".repeat(value) +
        "☆".repeat(5 - value)
      );
    };


    // =========================================
    // SHOW ERROR
    // =========================================

    const showMessage = (
      text,
    ) => {
      message.textContent = text;

      message.classList.add(
        "error",
      );
    };


    // =========================================
    // CLEAR MESSAGE
    // =========================================

    const clearMessage = () => {
      message.textContent = "";

      message.classList.remove(
        "error",
      );
    };


    // =========================================
    // FORMAT DATE
    // =========================================

    const formatDate = (
      value,
    ) => {
      if (!value) {
        return "-";
      }

      const date =
        new Date(value);

      if (
        Number.isNaN(
          date.getTime(),
        )
      ) {
        return "-";
      }

      return date.toLocaleString(
        "ar-JO",
        {
          dateStyle: "short",
          timeStyle: "short",
        },
      );
    };


    // =========================================
    // UPDATE RATING BREAKDOWN
    // =========================================

    const updateRatingBreakdown = (
      stats,
    ) => {
      const total =
        Number(
          stats.totalRatings || 0,
        );

      const ratings = {
        5: Number(
          stats.fiveStars || 0,
        ),

        4: Number(
          stats.fourStars || 0,
        ),

        3: Number(
          stats.threeStars || 0,
        ),

        2: Number(
          stats.twoStars || 0,
        ),

        1: Number(
          stats.oneStar || 0,
        ),
      };

      Object.entries(
        ratings,
      ).forEach(
        ([star, count]) => {
          const countElement =
            document.getElementById(
              `count${star}`,
            );

          const bar =
            document.getElementById(
              `bar${star}`,
            );

          if (countElement) {
            countElement.textContent =
              count;
          }

          if (bar) {
            const percentage =
              total > 0
                ? (count / total) *
                  100
                : 0;

            bar.style.width =
              `${percentage}%`;
          }
        },
      );
    };


    // =========================================
    // RENDER RATINGS
    // =========================================

    const renderRatings = (
      ratings,
    ) => {
      const list =
        Array.isArray(
          ratings,
        )
          ? ratings
          : [];

      if (
        list.length === 0
      ) {
        ratingsContainer.innerHTML = `
          <div class="empty">
            لا توجد تقييمات لهذا الموظف حتى الآن.
          </div>
        `;

        return;
      }

      const rows =
        list
          .map(
            (item) => `
              <tr>

                <td>
                  <span class="conversation-number">
                    #${item.id}
                  </span>
                </td>

                <td>
                  ${
                    item.customer_name ||
                    "عميل"
                  }
                </td>

                <td>
                  <div class="stars">
                    ${createStars(
                      item.rating,
                    )}
                  </div>
                </td>

                <td>
                  <div class="comment">
                    ${
                      item.rating_comment
                        ? String(
                            item.rating_comment,
                          )
                        : "بدون تعليق"
                    }
                  </div>
                </td>

                <td>
                  <span class="message-count">
                    ${
                      Number(
                        item.agent_message_count ||
                          0,
                      )
                    }
                    رسالة
                  </span>
                </td>

                <td>
                  <span class="date">
                    ${formatDate(
                      item.rated_at,
                    )}
                  </span>
                </td>

              </tr>
            `,
          )
          .join("");

      ratingsContainer.innerHTML = `
        <table>

          <thead>
            <tr>

              <th>
                المحادثة
              </th>

              <th>
                العميل
              </th>

              <th>
                التقييم
              </th>

              <th>
                التعليق
              </th>

              <th>
                ردود الموظف
              </th>

              <th>
                التاريخ
              </th>

            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>

        </table>
      `;
    };


    // =========================================
    // LOAD EMPLOYEE REPORT
    // =========================================

    const loadEmployeeReport =
      async () => {

        const name =
          employeeNameInput.value.trim();

        clearMessage();

        if (!name) {
          showMessage(
            "اكتب اسم الموظف أولًا.",
          );

          employeeNameInput.focus();

          return;
        }

        searchEmployeeBtn.disabled =
          true;

        searchEmployeeBtn.textContent =
          "جاري التحميل...";

        employeeHeader.classList.remove(
          "show",
        );

        statsGrid.style.display =
          "none";

        contentGrid.style.display =
          "none";

        ratingsContainer.innerHTML = `
          <div class="loading">
            جاري تحميل تقرير الموظف...
          </div>
        `;

        try {
          const response =
            await fetch(
              `/api/admin/support/ratings?employeeName=${encodeURIComponent(
                name,
              )}`,
              {
                method: "GET",

                headers: {
                  Accept:
                    "application/json",
                },

                cache: "no-store",
              },
            );

          const data =
            await response.json();

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.message ||
                "تعذر تحميل التقرير",
            );
          }

          if (
            !data.employee
          ) {
            showMessage(
              "لم يتم العثور على موظف بهذا الاسم.",
            );

            ratingsContainer.innerHTML = `
              <div class="empty">
                لم يتم العثور على الموظف.
              </div>
            `;

            return;
          }

          const stats =
            data.stats || {};


          // =====================================
          // EMPLOYEE
          // =====================================

          employeeName.textContent =
            data.employee.name;


          // =====================================
          // AVERAGE RATING
          // =====================================

          const average =
            Number(
              stats.averageRating || 0,
            );

          averageRating.textContent =
            average.toFixed(2);

          const roundedAverage =
            Math.round(
              average,
            );

          averageStars.textContent =
            roundedAverage > 0
              ? createStars(
                  roundedAverage,
                )
              : "لا يوجد تقييم";


          // =====================================
          // STATS
          // =====================================

          totalAssigned.textContent =
            Number(
              stats.totalAssignedConversations ||
                0,
            );

          respondedConversations.textContent =
            Number(
              stats.respondedConversations ||
                0,
            );

          totalMessages.textContent =
            Number(
              stats.totalMessagesSent ||
                0,
            );

          responseRate.textContent =
            `${Number(
              stats.responseRate || 0,
            )}%`;


          // =====================================
          // RATING BREAKDOWN
          // =====================================

          updateRatingBreakdown(
            stats,
          );


          // =====================================
          // RATINGS TABLE
          // =====================================

          renderRatings(
            data.ratings,
          );


          // =====================================
          // SHOW CONTENT
          // =====================================

          employeeHeader.classList.add(
            "show",
          );

          statsGrid.style.display =
            "grid";

          contentGrid.style.display =
            "grid";

        } catch (error) {

          console.error(
            "ADMIN SUPPORT REPORT ERROR:",
            error,
          );

          showMessage(
            error.message ||
              "حدث خطأ أثناء تحميل التقرير",
          );

          ratingsContainer.innerHTML = `
            <div class="empty">
              تعذر تحميل التقرير.
            </div>
          `;

        } finally {

          searchEmployeeBtn.disabled =
            false;

          searchEmployeeBtn.textContent =
            "🔍 عرض التقرير";
        }
      };


    // =========================================
    // SEARCH BUTTON
    // =========================================

    searchEmployeeBtn.addEventListener(
      "click",
      loadEmployeeReport,
    );


    // =========================================
    // ENTER TO SEARCH
    // =========================================

    employeeNameInput.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Enter"
        ) {
          loadEmployeeReport();
        }
      },
    );
  },
);