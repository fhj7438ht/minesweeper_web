import { Controller } from './Controller.js';

const controller = new Controller(); // Точка входа приложения

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    await controller.initialize();
});

