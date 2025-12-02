// Toast notification service
let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 400px;
        pointer-events: none;
      `;
      document.body.appendChild(toastContainer);
    }
  }
  return toastContainer;
}

function createToastElement(message, type = "info", duration = 3000) {
  const toast = document.createElement("div");

  const bgColor =
    {
      success: "#10b981",
      error: "#ef4444",
      info: "#3b82f6",
      warning: "#f59e0b",
    }[type] || "#3b82f6";

  const icon =
    {
      success: "",
      error: "",
      info: "",
      warning: "",
    }[type] || "";

  toast.style.cssText = `
    background-color: ${bgColor};
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    animation: slideIn 0.3s ease-out;
    pointer-events: auto;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 100%;
    word-wrap: break-word;
  `;

  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

  // Add animation if not exists
  if (!document.querySelector("style[data-toast]")) {
    const style = document.createElement("style");
    style.setAttribute("data-toast", "true");
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  return { element: toast, bgColor };
}

export function showToast(message, type = "info", duration = 3000) {
  const container = getToastContainer();
  const { element } = createToastElement(message, type, duration);

  container.appendChild(element);

  if (duration > 0) {
    setTimeout(() => {
      element.style.animation = "slideOut 0.3s ease-out forwards";
      setTimeout(() => {
        element.remove();
      }, 300);
    }, duration);
  }

  return element;
}

export function toast(message, type = "info") {
  showToast(message, type, 3000);
}

export function success(message, duration = 3000) {
  showToast(message, "success", duration);
}

export function error(message, duration = 3000) {
  showToast(message, "error", duration);
}

export function info(message, duration = 3000) {
  showToast(message, "info", duration);
}

export function warning(message, duration = 3000) {
  showToast(message, "warning", duration);
}
