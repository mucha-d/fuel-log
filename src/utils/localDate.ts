export const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

export const parseLocalDate = (date: string, endOfDay = false): Date => {
    const [year, month, day] = date.split("-").map(Number);
    const hours = endOfDay ? 23 : 0;
    const minutes = endOfDay ? 59 : 0;
    const seconds = endOfDay ? 59 : 0;
    const milliseconds = endOfDay ? 999 : 0;

    return new Date(year, month - 1, day, hours, minutes, seconds, milliseconds);
};
