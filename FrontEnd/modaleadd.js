
(() => {
    function initModaleAdd() {
        const modaleAdd = document.querySelector(".modale-add");
        const form = document.querySelector(".modale-add form");

        if (!modaleAdd || !form) {
            // La page peut charger ce script sans la modale
            return;
        }

        // Champs 
        const fileInput = modaleAdd.querySelector('.add-image input[type="file"]') || form.querySelector('input[type="file"]');
        const titleInput = modaleAdd.querySelector('.title input[type="text"]') || form.querySelector('input[type="text"]');
        const categorySelect = document.getElementById("cat-modale") || form.querySelector("select");
        const formError = document.getElementById("formError");
        const validateBtn = document.getElementById("add-photo-validate");

        // Helpers erreur
        const clearError = () => {
            if (!formError) return;
            formError.textContent = "";
            formError.style.display = "none";
        };

        const showError = (message) => {
            if (!formError) return;
            formError.textContent = message;
            formError.style.display = "block";
        };
        
        if (validateBtn) {
            validateBtn.addEventListener("click", (event) => {

                if (validateBtn.disabled) return;

                event.preventDefault();
                event.stopPropagation();

                if (typeof form.requestSubmit === "function") {
                    form.requestSubmit();
                } else {
                    form.submit();
                }
            });
        }

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            clearError();

            const token = localStorage.getItem("token");

            const imageFile = fileInput && fileInput.files ? fileInput.files[0] : null;
            const title = titleInput ? titleInput.value.trim() : "";
            const category = categorySelect ? categorySelect.value : "";

            if (!imageFile || !title || !category) {
                showError("Merci de remplir les 3 champs (image, titre, catégorie). ");
                return;
            }

            if (!token) {
                showError("Tu dois être connecté pour ajouter une photo.");
                return;
            }

            try {
                const formData = new FormData();
                formData.append("image", imageFile);
                formData.append("title", title);
                formData.append("category", String(category));

                const response = await fetch("http://localhost:5678/api/works", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error("Erreur lors de l'ajout de l'image");
                }

                const newWork = await response.json();

                document.dispatchEvent(new CustomEvent("workAdded", { detail: newWork }));

                form.reset();
            } catch (error) {
                console.error(error);
                showError(error.message || "Erreur lors de l'ajout.");
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initModaleAdd);
    } else {
        initModaleAdd();
    }
})();
