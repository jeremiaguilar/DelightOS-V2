export const ticketService = {
  formatTicketText(businessName: string, address: string, phone: string): string {
    return `${businessName}\n${address}\nTel: ${phone}`;
  }
};
