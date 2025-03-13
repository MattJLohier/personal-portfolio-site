const enableMobileCheck = false; // Set to true to enable mobile check


function checkViewport() {
    if (!enableMobileCheck) {
      document.getElementById('hidden-content').style.display = 'block';
      document.getElementById('mobile-message').style.display = 'none';
      return;
    }
    if (window.innerWidth < 768) {
      document.getElementById('hidden-content').style.display = 'none';
      document.getElementById('mobile-message').style.display = 'block';
    } else {
      document.getElementById('hidden-content').style.display = 'block';
      document.getElementById('mobile-message').style.display = 'none';
    }
  }

function showPopupAndRedirect(url) {
	const popupOverlay = document.getElementById('popup-overlay');
	const popupMessage = document.getElementById('popup-message');
	popupOverlay.style.display = 'flex';

	// Store a flag in sessionStorage
	sessionStorage.setItem('popupShown', 'true');

	// Set the popup border color to green before redirecting
	setTimeout(() => {
		popupMessage.style.borderColor = 'green';
		setTimeout(() => {
			popupOverlay.style.display = 'none';
			sessionStorage.removeItem('popupShown');
			window.location.href = url;
		}, 900);
	}, 1400);
}

function hidePopup() {
	const popupOverlay = document.getElementById('popup-overlay');
	popupOverlay.style.display = 'none';
	sessionStorage.removeItem('popupShown');
}

function checkPopupShown() {
	const urlParams = new URLSearchParams(window.location.search);
	if (urlParams.get('popupShown') === 'true' || sessionStorage.getItem('popupShown') === 'true') {
		hidePopup();
		urlParams.delete('popupShown');
		const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
		history.replaceState(null, '', newUrl);
	}
}

window.onload = function() {
	checkViewport();
	checkPopupShown();
};

window.onresize = checkViewport;

document.addEventListener('DOMContentLoaded', () => {
	// Smooth scroll with offset adjustment
	const offset = 170;
	document.querySelectorAll('a[href^="#"]').forEach(anchor => {
		anchor.addEventListener('click', function (e) {
			e.preventDefault();
			const targetId = this.getAttribute('href');
			if (targetId === "#") {
				window.scrollTo({
					top: 0,
					behavior: 'smooth'
				});
			} else {
				const target = document.querySelector(targetId);
				if (target) {
					const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
					window.scrollTo({
						top: targetPosition,
						behavior: 'smooth'
					});
				}
			}
		});
	});

	// Initialize display for projects and cards
	const projects = document.querySelectorAll('article.style2');
	const cards = document.querySelectorAll('.card');

	projects.forEach(project => project.style.display = 'block');
	cards.forEach(card => card.style.display = 'block');

	// Attach click event to filter buttons
	const filterButtons = document.querySelectorAll('.filter-bar p');
	filterButtons.forEach(button => {
		button.addEventListener('click', () => {
			const type = button.getAttribute('data-type');
			const color = button.style.color;
			filterProjects(type, color);
		});
	});
});

function showFilterPopup(color) {
	const popup = document.getElementById('filter-popup');
	const popupText = document.getElementById('filter-popup-text');
	popupText.style.color = color;
	popup.classList.add('visible');

	setTimeout(() => {
		popup.classList.remove('visible');
	}, 800);
}

function filterProjects(type, color) {
    const lowerType = type.toLowerCase();
    
    // ----- Filter Tile Projects (inside <section class="tiles">) -----
    const tiles = document.querySelectorAll('section.tiles article.style2');
    tiles.forEach(tile => {
      const tileType = (tile.getAttribute('data-type') || '').toLowerCase();
      tile.style.display = (type === 'all' || tileType.includes(lowerType)) ? 'block' : 'none';
    });
    
    // ----- Filter Cards Inside Articles Containers -----
    // Process each container that holds card(s)
    const cardContainers = document.querySelectorAll('.container.articles-container');
    cardContainers.forEach(container => {
      let anyCardVisible = false;
      // Process each card within this container
      const cards = container.querySelectorAll('.card');
      cards.forEach(card => {
        let matches = false;
        if (type === 'all') {
          matches = true;
        } else {
          // Check the card's own data-type attribute
          const dataType = (card.getAttribute('data-type') || '').toLowerCase();
          if (dataType && dataType.includes(lowerType)) {
            matches = true;
          } else {
            // First, check for any descendant with the "tag" class
            const tagElements = card.querySelectorAll('p.tag');
            for (const tagElem of tagElements) {
              if (tagElem.textContent.toLowerCase().includes(lowerType)) {
                matches = true;
                break;
              }
            }
            // If no match found, also check any <b> elements in case the tags aren't marked with a class
            if (!matches) {
              const bElements = card.querySelectorAll('b');
              for (const bElem of bElements) {
                if (bElem.textContent.toLowerCase().includes(lowerType)) {
                  matches = true;
                  break;
                }
              }
            }
          }
        }
        // Show or hide the card based on whether it matches
        card.style.display = matches ? 'block' : 'none';
        if (matches) {
          anyCardVisible = true;
        }
      });
      // Hide the container if none of its cards are visible; otherwise, show it
      container.style.display = anyCardVisible ? '' : 'none';
    });
    
    // ----- Update Active State on Filter Buttons -----
    const buttons = document.querySelectorAll('.filter-bar p');
    buttons.forEach(button => {
      button.classList.remove('active');
      if (button.getAttribute('data-type').toLowerCase() === lowerType) {
        button.classList.add('active');
      }
    });
    
    showFilterPopup(color);
  }
  
  
  


// Private project click handler
// Revised handler for private project click events
document.addEventListener('DOMContentLoaded', () => {
    const privateProjects = document.querySelectorAll('a.private-project');
    privateProjects.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent navigation
        
        // Locate the article container that wraps this link
        const article = this.closest('article.style2');
        let textElements = [];
        
        if (article) {
          // Get all direct children of the article
          const children = Array.from(article.children);
          // Filter out the image container and the last <p> element
          textElements = children.filter((child, index) => {
            // Skip the image container
            if (child.classList.contains('image')) return false;
            // If it's the last element and is a <p>, keep it visible
            if (child.tagName.toLowerCase() === 'p' && index === children.length - 1) return false;
            return true;
          });
          
          // Fade out the selected elements
          textElements.forEach(elem => {
            elem.style.transition = 'opacity 0.5s';
            elem.style.opacity = '0';
          });
        }
        
        // Get the image container where the overlay will be appended
        let imageContainer = article ? article.querySelector('.image') : this;
        if (!imageContainer) {
           imageContainer = this;
        }
        
        // Ensure the image container is positioned relatively
        if (getComputedStyle(imageContainer).position === 'static') {
           imageContainer.style.position = 'relative';
        }
        
        // Create and append the overlay element for the private project message
        let overlay = document.createElement('div');
        overlay.className = 'private-overlay-image';
        overlay.innerHTML = '<span class="first-line">Private Project 🔒</span><span class="second-line">reach out for more details...</span>';
        overlay.style.transition = 'opacity 0.5s';
        overlay.style.opacity = '0'; // Start transparent
        imageContainer.appendChild(overlay);
        
        // Fade in the overlay
        requestAnimationFrame(() => {
          overlay.style.opacity = '1';
        });
        
        // After 2 seconds, fade out the overlay and restore hidden content
        setTimeout(() => {
          overlay.style.opacity = '0';
          setTimeout(() => {
            if (imageContainer.contains(overlay)) {
              imageContainer.removeChild(overlay);
            }
            // Restore the hidden written content by setting opacity back to 1
            textElements.forEach(elem => {
              elem.style.opacity = '1';
            });
          }, 500); // Wait for the overlay fade-out to complete
        }, 2500);
      });
    });
});
