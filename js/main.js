/**
 * 1. Global Navigation (All Pages)
 *    - Loads the navigation bar from nav.html
 *    - Highlights the current page's nav link
 *
 * 2. Students Page (students.html)
 *    - Loads student data dynamically from students.json
 *    - Builds student member cards dynamically
 *    - Filters students by role (Current, Alumni, etc.)
 *    - Filters students by first letter of name (A–Z)
 *
 * 3. Publications Page (publications.html)
 *    - Filters publications by year or type (Journal, Conference)
 *    - Provides keyword-based search with result highlighting
 */
document.addEventListener("DOMContentLoaded", () => {
  // 1. Load nav bar
  fetch("nav.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("nav-placeholder").innerHTML = data;

      //burger
      const burger = document.getElementById("burger-toggle");
      const navMenu = document.querySelector(".nav-menu");
      if (burger && navMenu) {
        burger.addEventListener("click", () => {
          navMenu.classList.toggle("active");
          burger.classList.toggle("active");
        });
      }

      const currentPage = window.location.pathname.split("/").pop();
      const teamRelated = ["team.html", "students.html", "pi.html"];
      const resourceRelated = ["resources.html", "admissions.html", "software.html"];

      if (teamRelated.includes(currentPage)) {
        const teamLink = document.getElementById("team-link");
        if (teamLink) teamLink.classList.add("active");
      }

      if (resourceRelated.includes(currentPage)) {
        const resourceLink = document.getElementById("resources-link");
        if (resourceLink) resourceLink.classList.add("active");
      }

      document.querySelectorAll(".nav-menu a").forEach(link => {
        if (link.getAttribute("href") === currentPage) {
          link.classList.add("active");
        }
      });

      document.querySelectorAll(".social a").forEach(link => {
        if (!link.getAttribute("href")) {
          link.classList.add("disabled");
        }
      });
    });
  // Load footer
  fetch("footer.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("footer-placeholder").innerHTML = data;
    });

  // 2. Students Page Filters & Load
  if (window.location.pathname.endsWith("students.html")) {
    fetch("students.json")
      .then(response => response.json())
      .then(data => {
        const row = document.querySelector(".team .row");
        data.students.forEach(student => {
          const card = document.createElement("div");
          card.className = "col-lg-6 mt-4";
          card.innerHTML = `
          <div class="member d-flex align-items-start" data-role="${student.status} ${student.degree}">
            <div class="teampic">
              <img src="${student.image}" class="img-fluid" alt="${student.name}">
            </div>
            <div class="member-info">
              <h4>${student.linkedin ? `<a href="${student.linkedin}" target="_blank">${student.name}</a>` : student.name}</h4>
              <span>${student.degree}</span>
              <p>${student.description || ""}</p>
            </div>
          </div>
        `;
          row.appendChild(card);
        });

        // Re-run filters after cards are added
        const roleButtons = document.querySelectorAll(".role-filters button");
        const letterButtons = document.querySelectorAll(".letter-filters a");
        const members = document.querySelectorAll(".member");

        let currentRole = "Current";
        let currentLetter = "All";

        function applyFilters() {
          const subRoles = ["PhD", "Masters", "Undergraduate", "Visiting Researcher", "Other"];

          members.forEach(member => {
            const roles = (member.getAttribute("data-role") || "").split(" ");
            const status = roles[0]; // e.g. "Current"
            const degree = roles[1]; // e.g. "Masters"
            const name = member.querySelector("h4")?.innerText.trim().toUpperCase() || "";
            const firstLetter = name.charAt(0);

            let roleMatch = false;

            if (currentRole === "All") {
              roleMatch = true;
            } else if (currentRole === "Alumni") {
              roleMatch = status === "Alumni";
            } else if (subRoles.includes(currentRole)) {
              roleMatch = status === "Current" && degree === currentRole;
            } else if (currentRole === "Current") {
              roleMatch = status === "Current";
            }

            const letterMatch = currentLetter === "All" || firstLetter === currentLetter;

            const show = roleMatch && letterMatch;
            member.parentElement.style.display = show ? "block" : "none";
          });
        }


        roleButtons.forEach(btn => {
          btn.addEventListener("click", () => {
            roleButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentRole = btn.getAttribute("data-filter");
            applyFilters();
          });
        });

        letterButtons.forEach(btn => {
          btn.addEventListener("click", e => {
            e.preventDefault();
            letterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentLetter = btn.getAttribute("data-letter");
            applyFilters();
          });
        });

        applyFilters();
      });
  }

  // 3. Publications Page Filters & Load
  if (window.location.pathname.endsWith("publications.html")) {
    const container = document.querySelector(".container");
    const filterButtons = document.querySelectorAll(".publication-filters button");
    const searchInput = document.getElementById("searchBox");
    let currentFilter = "All";

    fetch("publications.json")
      .then(response => response.json())
      .then(data => {
        const grouped = {};
        data.publications.forEach(pub => {
          if (!grouped[pub.year]) grouped[pub.year] = [];
          grouped[pub.year].push(pub);
        });

        Object.keys(grouped).sort((a, b) => b - a).forEach(year => {
          const group = document.createElement("div");
          group.className = "pub-group";
          group.setAttribute("data-year", year);

          const heading = document.createElement("h3");
          heading.className = "pub-year";
          heading.textContent = year;
          group.appendChild(heading);

          grouped[year].forEach(pub => {
            const item = document.createElement("div");
            item.className = "publication-item";
            item.setAttribute("data-year", pub.year);
            item.setAttribute("data-type", pub.type);

            const p = document.createElement("p");
            p.innerHTML = `${pub.authors},<br>
              <a href="${pub.link}" target="_blank" class="pub-title">"${pub.title}"</a>,
              <em>${pub.venue}</em>, ${pub.date}${pub.pages ? ", " + pub.pages : ""}${pub.note ? ", " + pub.note : ""}.`;

            item.appendChild(p);
            group.appendChild(item);
          });

          container.appendChild(group);
        });

        // Add filtering
        function filterPublications() {
          const keyword = searchInput?.value.toLowerCase() || "";
          const groups = document.querySelectorAll(".pub-group");

          groups.forEach(group => {
            const groupYear = group.getAttribute("data-year");
            const items = group.querySelectorAll(".publication-item");
            let hasVisible = false;

            items.forEach(pub => {
              const type = pub.getAttribute("data-type");
              const originalText = pub.innerText.toLowerCase();

              const matchesFilter =
                currentFilter === "All" ||
                currentFilter === groupYear ||
                currentFilter === type;
              const matchesSearch = originalText.includes(keyword);
              const shouldShow = matchesFilter && matchesSearch;

              pub.style.display = shouldShow ? "block" : "none";
              if (shouldShow) hasVisible = true;
            });

            group.style.display = hasVisible ? "block" : "none";
          });
        }

        filterButtons.forEach(btn => {
          btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.getAttribute("data-filter");
            filterPublications();
          });
        });

        searchInput?.addEventListener("input", filterPublications);

        filterPublications();
      });
  }

  // Show/hide Back to Top button
  window.addEventListener("scroll", function () {
    const backToTop = document.querySelector(".back-to-top");
    if (window.scrollY > 300) {
      backToTop.style.display = "flex";
    } else {
      backToTop.style.display = "none";
    }
  });
});