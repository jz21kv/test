document.addEventListener("DOMContentLoaded", () => {
  // 1. Load nav bar
  fetch("nav.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("nav-placeholder").innerHTML = data;

      // burger
      const burger = document.getElementById("burger-toggle");
      const navMenu = document.querySelector(".nav-menu");
      if (burger && navMenu) {
        burger.addEventListener("click", () => {
          navMenu.classList.toggle("active");
          burger.classList.toggle("active");
        });

        document.addEventListener("click", (e) => {
          if (!navMenu.contains(e.target) && !burger.contains(e.target)) {
            navMenu.classList.remove("active");
            burger.classList.remove("active");
          }
        });
      }

      document.querySelectorAll(".nav-menu a").forEach(link => {
        link.addEventListener("click", function (e) {
          e.preventDefault();
          const href = link.getAttribute("href").replace(/^\.\/|\/$/g, "");
          const page = href || "about";
          history.pushState(null, "", `./${page}`);
          loadPage(page);
        });
      });

      const logoImg = document.getElementById("logo-img");
      if (logoImg) {
        logoImg.addEventListener("click", (e) => {
          e.preventDefault();
          const page = "about";
          history.pushState(null, "", `./${page}`);
          loadPage(page);
        });
      }
    });

  // 2. Load footer
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

  // 3. First Load the correct page
  const page = window.location.pathname.split("/").pop().replace(".html", "") || "about";
  loadPage(page);
});

// 4. Handle browser back/forward
window.addEventListener("popstate", () => {
  const page = window.location.pathname.split("/").pop().replace(".html", "") || "about";
  loadPage(page);
});

// 5. Universal page loader
function loadPage(page) {
  fetch(`${page}.html`)
    .then(res => {
      if (!res.ok) throw new Error(`Page not found: ${page}`);
      return res.text();
    })
    .then(html => {
      document.getElementById("content").innerHTML = html;
      setActiveNav(page);

      if (page === "students") loadStudentsPage();
      if (page === "publications") loadPublicationsPage();
      if (page === "contact") generateEmail();

      // Close burger after navigation
      const burger = document.getElementById("burger-toggle");
      const navMenu = document.querySelector(".nav-menu");
      if (burger?.classList.contains("active")) {
        burger.classList.remove("active");
        navMenu?.classList.remove("active");
      }
    })
    .catch(error => {
      console.error(error);
      // fallback to about
      loadPage("about");
    });
}

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

function generateEmail() {
  const username = "yli2";
  const domain = "brocku.ca";
  const emailLink = `<a href="mailto:${username}@${domain}">${username}@${domain}</a>`;
  const emailElement = document.getElementById("email");
  if (emailElement) {
    emailElement.innerHTML = emailLink;
  }
}

// 6. Students page
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

      const roleButtons = document.querySelectorAll(".role-filters button");
      const letterButtons = document.querySelectorAll(".letter-filters a");
      const members = document.querySelectorAll(".member");

      let currentRole = "Current";
      let currentLetter = "All";

      function applyFilters() {
        const subRoles = ["PhD", "Masters", "Undergraduate", "Visiting Researcher", "Other"];

        members.forEach(member => {
          const roles = (member.getAttribute("data-role") || "").split(" ");
          const status = roles[0];
          const degree = roles[1];
          const name = member.querySelector("h4")?.innerText.trim().toUpperCase() || "";
          const firstLetter = name.charAt(0);

          let roleMatch = false;
          if (currentRole === "All") roleMatch = true;
          else if (currentRole === "Alumni") roleMatch = status === "Alumni";
          else if (subRoles.includes(currentRole)) roleMatch = status === "Current" && degree === currentRole;
          else if (currentRole === "Current") roleMatch = status === "Current";

          const letterMatch = currentLetter === "All" || firstLetter === currentLetter;
          member.parentElement.style.display = roleMatch && letterMatch ? "block" : "none";
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

// 7. Publications page
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

            const matchesFilter = currentFilter === "All" || currentFilter === groupYear || currentFilter === type;
            const matchesSearch = originalText.includes(keyword);
            const shouldShow = matchesFilter && matchesSearch;

            pub.style.display = shouldShow ? "block" : "none";
            if (shouldShow) hasVisible = true;

            if (matchesSearch && keyword.length > 0) {
              const regex = new RegExp(`(${keyword})`, "gi");
              const cleanHTML = pub.innerHTML.replace(/<\/?mark>/gi, "");
              pub.innerHTML = cleanHTML.replace(regex, "<mark>$1</mark>");
            } else {
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

// 8. back to top
window.addEventListener("scroll", function () {
  const backToTop = document.querySelector(".back-to-top");
  backToTop.style.display = window.scrollY > 300 ? "flex" : "none";
});
