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

      // Close the menu if click outside of it
      document.addEventListener("click", (e) => {
        if (!navMenu.contains(e.target) && !burger.contains(e.target)) {
          navMenu.classList.remove("active");
          burger.classList.remove("active");
        }
      });

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
        link.addEventListener("click", function (e) {
          e.preventDefault();
          const href = link.getAttribute("href").replace(/^\.\/|\/$/g, "");
          const page = href || "index";

          fetch(`${page}.html`)
            .then(res => res.text())
            .then(html => {
              document.getElementById("content").innerHTML = html;
              history.pushState(null, "", `./${page}`);

              setActiveNav(page);

              if (page === "students") loadStudentsPage();
              if (page === "publications") loadPublicationsPage();

              // Use JS to dynamically generate email to prevent spam instead of hardcoding it in HTML
              if (page === "contact") {
                const username = "yli2";
                const domain = "brocku.ca";
                const emailLink = `<a href="mailto:${username}@${domain}">${username}@${domain}</a>`;
                const emailElement = document.getElementById("email");
                if (emailElement) {
                  emailElement.innerHTML = emailLink;
                }
              }

              // auto close burger
              const burger = document.getElementById("burger-toggle");
              const navMenu = document.querySelector(".nav-menu");
              if (burger?.classList.contains("active")) {
                burger.classList.remove("active");
                navMenu?.classList.remove("active");
              }
            });
        });
      });

      document.querySelectorAll(".social a").forEach(link => {
        if (!link.getAttribute("href")) {
          link.classList.add("disabled");
        }
      });
    });

  // Load footer and run any scripts inside it
  fetch("footer.html")
    .then(response => response.text())
    .then(data => {
      const footerContainer = document.getElementById("footer-placeholder");
      footerContainer.innerHTML = data;

      footerContainer.querySelectorAll("script").forEach(oldScript => {
        const newScript = document.createElement("script");
        if (oldScript.src) {
          newScript.src = oldScript.src;
        } else {
          newScript.textContent = oldScript.textContent;
        }
        document.body.appendChild(newScript);
      });
    });

  // 2. Students Page Filters & Load
  function loadStudentsPage() {
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
  function loadPublicationsPage() {
    const container = document.getElementById("publicationContainer");
    if (!container) return;
    container.innerHTML = "";

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

              // keyword highlighting 
              if (matchesSearch && keyword.length > 0) {
                const regex = new RegExp(`(${keyword})`, "gi");
                const cleanHTML = pub.innerHTML.replace(/<\/?mark>/gi, ""); // remove previous highlights
                pub.innerHTML = cleanHTML.replace(regex, "<mark>$1</mark>");
              } else {
                // remove highlight if no match
                pub.innerHTML = pub.innerHTML.replace(/<\/?mark>/gi, "");
              }
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
    backToTop.style.display = window.scrollY > 300 ? "flex" : "none";
  });

  // Popstate navigation
  window.addEventListener("popstate", () => {
    const page = window.location.pathname.split("/").pop().replace(".html", "") || "index";

    fetch(`${page}.html`)
      .then(res => res.text())
      .then(html => {
        document.getElementById("content").innerHTML = html;
        setActiveNav(page);

        if (page === "students") loadStudentsPage();
        if (page === "publications") loadPublicationsPage();
      });
  });
});

function setActiveNav(page) {
  const cleanPage = page.replace(".html", "");

  document.querySelectorAll(".nav-menu a").forEach(link => link.classList.remove("active"));
  document.getElementById("team-link")?.classList.remove("active");
  document.getElementById("resources-link")?.classList.remove("active");

  document.querySelectorAll(".nav-menu a").forEach(link => {
    const href = link.getAttribute("href").replace(/^\.\/|\/$/g, "").replace(".html", "");
    if (href === cleanPage) {
      link.classList.add("active");
    }
  });

  const teamPages = ["students", "pi"];
  const resourcePages = ["admissions", "software"];
  if (teamPages.includes(cleanPage)) document.getElementById("team-link")?.classList.add("active");
  if (resourcePages.includes(cleanPage)) document.getElementById("resources-link")?.classList.add("active");
}