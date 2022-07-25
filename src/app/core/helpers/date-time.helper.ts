export class DateTimeHelper {
  public static getLastDayOfWeekFromFirstDay(startDate: string, days: number): string {
    const start = new Date(startDate);
    const offset = new Date().getTimezoneOffset() * 60 * 1000;
    const initDate = new Date(start.setUTCDate(start.getDate() - start.getDay() + days));
    const dayToSet = initDate > new Date() ? new Date() : initDate;
    const lastDay = dayToSet.setUTCHours(23, 59, 59, 999) + offset;

    return new Date(lastDay).toUTCString();
  }

  public static getFirstDayOfWeekUtc(date: string): string {
    const start = new Date(date);
    const offset = new Date().getTimezoneOffset() * 60 * 1000;
    const day = new Date(start.setUTCDate(start.getDate()))
      .setUTCHours(0, 0, 0, 0) + offset;

    return new Date(day).toUTCString();
  }

  public static convertDateToUtc(date: string): string {
    const init = new Date(date);
    const offset = new Date().getTimezoneOffset() * 60 * 1000;
    const day = new Date(init.setUTCDate(init.getDate()) + offset);

    return new Date(day).toUTCString();
  }

  public static toUtc(date: string | Date): string {
    const init = date as Date;
    return new Date(Date.UTC(init.getFullYear(), init.getMonth(), init.getDate(), init.getHours(), init.getMinutes())).toISOString();
  }
}
