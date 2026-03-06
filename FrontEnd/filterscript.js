const token = localStorage.getItem("token");
const gallery = document.querySelector(".gallery");
const filt = document.querySelector(".filter");

// verif du token pour edit mode

if (token) {
    const editmode = document.querySelector(".editmode");
    if (editmode) editmode.classList.add("is-visible-flex");

    if (filt) filt.classList.add("is-hidden");

    const loginLink = document.querySelector('.href-login');
    if (loginLink) {
        loginLink.textContent = "logout";
        loginLink.onclick = () => {
            localStorage.removeItem("token");
            window.location.href = "index.html";
        };
    }

    const editProject = document.querySelector(".editproject");
    if (editProject) {
        const editp = document.createElement("p");
        editp.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>Modifier';
        editProject.appendChild(editp);
    }
}

// 1 seul fetch pour chaque

let allWorks = [];
let allCategories = [];

async function getWorks(force = false) {
    if (!force && Array.isArray(allWorks) && allWorks.length) return allWorks;

    const res = await fetch("http://localhost:5678/api/works");
    if (!res.ok) throw new Error("Erreur API works");

    allWorks = await res.json();
    return allWorks;
}

async function getCategories(force = false) {
    if (!force && Array.isArray(allCategories) && allCategories.length) return allCategories;

    const res = await fetch("http://localhost:5678/api/categories");
    if (!res.ok) throw new Error("Erreur API catégories");

    allCategories = await res.json();
    return allCategories;
}

// Affichage de la gallerie

function filterGallery(works) {
    gallery.innerHTML = "";
    works.forEach(work => {
        const figure = document.createElement("figure");
        const img = document.createElement("img");
        const figcaption = document.createElement("figcaption");

        img.src = work.imageUrl;
        img.alt = work.title;
        figcaption.textContent = work.title;

        figure.appendChild(img);
        figure.appendChild(figcaption);
        gallery.appendChild(figure);
    });
}

(async () => {
    try {
        await getWorks();
        filterGallery(allWorks);
    } catch (err) {
        console.error("Erreur fetch works :", err);
    }
})();

// Bouton categorie

getCategories()
    .then(categories => {
        const newButton = document.createElement("button");
        newButton.textContent = "Tous";
        newButton.dataset.category = "all";
        newButton.classList.add("active");
        filt.appendChild(newButton);

        categories.forEach(cat => {
            const button = document.createElement("button");
            button.textContent = cat.name;
            button.dataset.category = cat.id;
            filt.appendChild(button);
        });

        const buttons = document.querySelectorAll('.filter button');

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                buttons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const category = button.dataset.category;
                if (category === "all") {
                    filterGallery(allWorks);
                } else {
                    const filtered = allWorks.filter((work) => String(work.categoryId) === String(category));
                    filterGallery(filtered);
                }
            });
        });

        filterGallery(allWorks);
    })
    .catch(err => console.error(err));

    // ouverture de la modale

(() => {
    const modal = document.querySelector('.modale');
    const modalContent = document.querySelector('.modale-content');
    const btnClose = document.getElementById('modale-close');
    const opener = document.querySelector('.editproject');

    async function openModal() {
        modal.classList.add('open');
        try {
            await getWorks();
            loadModalGallery();
        } catch (err) {
            console.error("Erreur fetch works :", err);
        }
        document.body.classList.add('modal-open');
    }

    function loadModalGallery() {
        const modalGallery = document.querySelector('.modale-img');
        if (!modalGallery) return;
        modalGallery.innerHTML = '';

        allWorks.forEach(work => {
            const figure = document.createElement('figure');
            figure.classList.add('modal-figure');

            const img = document.createElement('img');
            img.src = work.imageUrl;
            img.alt = work.title;

            const del = document.createElement('i');
            del.classList.add('fa-solid', 'fa-trash-can');
            del.addEventListener('click', (event) => {
                event.stopPropagation();
                event.preventDefault();
                fetch(`http://localhost:5678/api/works/${work.id}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    }
                })
                    .then(response => {
                        if (response.ok) {

                            figure.remove();

                            allWorks = allWorks.filter(w => String(w.id) !== String(work.id));

                            const activeBtn = document.querySelector('.filter button.active');
                            const activeCat = activeBtn ? activeBtn.dataset.category : "all";

                            if (activeCat === "all") {
                                filterGallery(allWorks);
                            } else {
                                const filtered = allWorks.filter(
                                    w => String(w.categoryId) === String(activeCat)
                                );
                                filterGallery(filtered);
                            }
                        } else {
                            console.error("Erreur suppression");
                        }
                    })
                    .catch(err => console.error("Erreur fetch DELETE :", err));
            });

            figure.appendChild(img);
            figure.appendChild(del);
            modalGallery.appendChild(figure);
        });
    }

// fermeture de la modale

    function closeModal() {
        modal.classList.remove('open');
        document.body.classList.remove('modal-open');
    }

    opener && opener.addEventListener('click', openModal);
    btnClose && btnClose.addEventListener('click', closeModal);

    if (modal) {
        modal.addEventListener('click', () => {
            closeModal();
        });
    }

    if (modalContent) {
        modalContent.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    }

    // ajout option cat

    async function loadCategoriesInModalSelect() {
        const select = document.getElementById("cat-modale");
        if (!select) return;
        if (select.dataset.loaded === "true") return;

        try {
            const categories = await getCategories();

            select.innerHTML = "";
            const defaultOpt = document.createElement("option");
            defaultOpt.value = "";
            select.appendChild(defaultOpt);

            categories.forEach((cat) => {
                const opt = document.createElement("option");
                opt.value = String(cat.id);
                opt.textContent = cat.name;
                select.appendChild(opt);
            });

            select.dataset.loaded = "true";
        } catch (err) {
            console.error(err);
            select.innerHTML = "";
            const opt = document.createElement("option");
            opt.value = "";
            opt.textContent = "(Erreur chargement catégories)";
            select.appendChild(opt);
        }
    }

    // reset aller retour

    function resetAddPhotoForm() {
        const modaleAdd = document.querySelector(".modale-add");
        if (!modaleAdd) return;

        const addImageDiv = modaleAdd.querySelector(".add-image");
        const fileInput = addImageDiv ? addImageDiv.querySelector('input[type="file"]') : null;
        const titleInput = modaleAdd.querySelector('.title input[type="text"]');
        const select = document.getElementById("cat-modale");

        if (titleInput) titleInput.value = "";
        if (select) select.value = "";

        if (addImageDiv) {
            const span = addImageDiv.querySelector("span");
            const p = addImageDiv.querySelector("p");
            const label = addImageDiv.querySelector("label.custom-file-btn");

            const preview = addImageDiv.querySelector("img.preview-img");
            if (preview) preview.remove();

            if (addImageDiv.dataset.previewUrl) {
                URL.revokeObjectURL(addImageDiv.dataset.previewUrl);
                delete addImageDiv.dataset.previewUrl;
            }

            if (span) span.classList.remove("is-hidden");
            if (p) p.classList.remove("is-hidden");
            if (label) label.classList.remove("is-hidden");
            if (fileInput) fileInput.value = "";
        }

        const formError = document.getElementById("formError");
        if (formError) {
            formError.textContent = "";
            formError.classList.add("is-hidden");
        }
    }

    // condition validation

    function updateValidateButtonState() {
        const modaleAdd = document.querySelector(".modale-add");
        if (!modaleAdd) return;

        const fileInput = modaleAdd.querySelector('.add-image input[type="file"]');
        const titleInput = modaleAdd.querySelector('.title input[type="text"]');
        const select = document.getElementById("cat-modale");
        const validateBtn = document.getElementById("add-photo-validate");
        if (!validateBtn) return;

        const hasImage = fileInput && fileInput.files && fileInput.files.length > 0;
        const hasTitle = titleInput && titleInput.value.trim() !== "";
        const hasCategory = select && select.value !== "";

        const isValid = hasImage && hasTitle && hasCategory;

        validateBtn.disabled = !isValid;
        validateBtn.classList.toggle("btn-disabled", !isValid);
        validateBtn.classList.toggle("cursor-not-allowed", !isValid);
    }

    const addBtn = document.getElementById("modale-add");
    const modaleAdd = document.querySelector(".modale-add");
    const modaleImg = document.querySelector(".modale-img");
    const modaleTitle = modalContent.querySelector("p");
    const modaleInputHandle = document.querySelector(".input-handle");

    if (addBtn) {
        addBtn.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            resetAddPhotoForm();
            if (modaleImg) modaleImg.classList.add("is-hidden");
            if (modaleTitle) modaleTitle.classList.add("is-hidden");
            if (modaleInputHandle) modaleInputHandle.classList.add("is-hidden");

            if (modaleAdd) modaleAdd.classList.add("is-visible-flex");
            loadCategoriesInModalSelect();
            updateValidateButtonState();
        });
    }

    const backBtn = document.getElementById("modale-back");

    if (backBtn) {
        backBtn.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            resetAddPhotoForm();
            updateValidateButtonState();
            if (modaleAdd) modaleAdd.classList.remove("is-visible-flex");

            if (modaleImg) modaleImg.classList.remove("is-hidden");
            if (modaleTitle) modaleTitle.classList.remove("is-hidden");
            if (modaleInputHandle) modaleInputHandle.classList.remove("is-hidden");
        });
    }
    document.addEventListener("input", (event) => {
        const target = event.target;
        if (!target) return;

        if (
            target.matches('.modale-add .title input[type="text"]') ||
            target.matches('#cat-modale')
        ) {
            updateValidateButtonState();
        }
    });

    document.addEventListener("change", (event) => {
        const target = event.target;
        if (!target) return;

        if (target.matches('.modale-add .add-image input[type="file"]')) {
            updateValidateButtonState();
        }
    });

    // Ajout photo

    const validateBtn = document.getElementById("add-photo-validate");
    if (validateBtn) {
        validateBtn.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();

            const fileInput = modaleAdd ? modaleAdd.querySelector('.add-image input[type="file"]') : null;
            const titleInput = modaleAdd ? modaleAdd.querySelector('.title input[type="text"]') : null;
            const select = document.getElementById("cat-modale");
            const formError = document.getElementById("formError");

            const imageFile = fileInput && fileInput.files ? fileInput.files[0] : null;
            const title = titleInput ? titleInput.value.trim() : "";
            const categoryId = select ? select.value : "";

            // reset erreur
            if (formError) {
                formError.textContent = "";
                formError.classList.add("is-hidden");
            }


            if (!imageFile || !title || !categoryId) {
                if (formError) {
                    formError.textContent = "Les 3 champs doivent être rempli";
                    formError.classList.remove("is-hidden");
                }
                updateValidateButtonState();
                return;
            }

            try {
                const formData = new FormData();
                formData.append("image", imageFile);
                formData.append("title", title);
                formData.append("category", String(categoryId));

                const response = await fetch("http://localhost:5678/api/works", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                const apiResponse = await response.json();

                console.log(apiResponse);

                console.log("Reponse API :", apiResponse);

                const newWork = apiResponse;

                // Mets à jour la liste en memoire
                allWorks.push(newWork);

                // Mets à jour la galerie principale selon le filtre actif
                const activeBtn = document.querySelector(".filter button.active");
                const activeCat = activeBtn ? activeBtn.dataset.category : "all";

                if (activeCat === "all") {
                    filterGallery(allWorks);
                } else {
                    const filtered = allWorks.filter(
                        (work) => String(work.categoryId) === String(activeCat)
                    );
                    filterGallery(filtered);
                }

                // Mets à jour la galerie de la modale
                loadModalGallery();

                // Reset + retour vue galerie modale
                resetAddPhotoForm();
                updateValidateButtonState();

                if (modaleAdd) modaleAdd.classList.remove("is-visible-flex");
                if (modaleImg) modaleImg.classList.remove("is-hidden");
                if (modaleTitle) modaleTitle.classList.remove("is-hidden");
                if (modaleInputHandle) modaleInputHandle.classList.remove("is-hidden");

                closeModal();
            } catch (err) {
                console.error(err);
                if (formError) {
                    formError.textContent = err.message || "Erreur lors de l'ajout.";
                    formError.classList.remove("is-hidden");
                }
            } finally {
                updateValidateButtonState();
            }
        });
    }
})();

// display image dans la modale

document.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;

    const isTarget = input.matches('#image-input') || input.matches('.add-image input[type="file"]');
    if (!isTarget) return;

    const file = input.files && input.files[0];
    if (!file) return;

    const addImageDiv = input.closest(".add-image") || document.querySelector(".add-image");
    if (!addImageDiv) return;

    const span = addImageDiv.querySelector("span");
    const p = addImageDiv.querySelector("p");
    const label = addImageDiv.querySelector("label.custom-file-btn");
    if (span) span.classList.add("is-hidden");
    if (p) p.classList.add("is-hidden");
    if (label) label.classList.add("is-hidden");

    const existingImg = addImageDiv.querySelector("img.preview-img");
    if (existingImg) existingImg.remove();

    if (addImageDiv.dataset.previewUrl) {
        URL.revokeObjectURL(addImageDiv.dataset.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    addImageDiv.dataset.previewUrl = previewUrl;

    const img = document.createElement("img");
    img.classList.add("preview-img");
    img.src = previewUrl;
    img.alt = "image selectionné";

    addImageDiv.appendChild(img);
});
