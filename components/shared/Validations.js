export const formatName = (text) => {
    if (!text) return '';
    const cleanedText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, '');
    return cleanedText
        .split(' ')
        .map(word => {
            if (word.length === 0) return '';
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
};

export const isValidName = (name) => {
    // CAMBIO: Valida que contenga solo letras, acentos, ñ y espacios, y que no esté vacío o solo contenga espacios.
    return /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/.test(name) && name.trim().length > 0;
};

export const isAdult = (dateString) => {
    if (!dateString) return false;
    const parts = dateString.split('-');
    if (parts.length !== 3) return false;

    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Meses son 0-indexados en JS Date
    const day = parseInt(parts[2]);

    const birthDate = new Date(year, month, day);
    // CAMBIO: Asegurarse de que la fecha sea válida antes de calcular la edad
    if (isNaN(birthDate.getTime()) || birthDate.getFullYear() !== year || birthDate.getMonth() !== month || birthDate.getDate() !== day) {
        return false; // La fecha no es válida
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age >= 18 && age <= 120;
};

export const formatPhoneNumber = (text) => {
    if (!text) return '';
    const cleaned = text.replace(/\D/g, '');
    return cleaned.slice(0, 10);
};

export const isValidPhoneNumber = (phoneNumber) => {
    return /^\d{10}$/.test(phoneNumber);
};

export const isValidDateFormat = (dateString) => {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
};

// CAMBIO: Validación de email más estricta
export const isValidEmail = (email) => {
    // Expresión regular para caracteres comunes de correo electrónico
    // Permite letras, números, puntos, guiones, guiones bajos y porcentajes antes del @
    // y letras, números, puntos y guiones después del @, seguido de un dominio de al menos 2 letras.
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
};

export const doPasswordsMatch = (password, confirmPassword) => {
    return password === confirmPassword;
};