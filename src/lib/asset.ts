/**
 * Путь к файлу из public/ с учётом базового пути сайта.
 *
 *   asset('/photos/oblako.jpg')  // '/photos/oblako.jpg' локально,
 *                                // '/lepestok/photos/oblako.jpg' на GitHub Pages
 *
 * Vite сам добавляет base только в index.html и CSS; строки в JS/TSX — нет.
 */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
