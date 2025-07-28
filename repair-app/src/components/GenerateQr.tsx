function qr(qrText: string): string {
    const qrPath = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=";
    return qrPath + qrText;
}
export default qr;