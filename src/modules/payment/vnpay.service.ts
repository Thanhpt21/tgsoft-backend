import * as qs from 'qs';
import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';

export interface VnpayConfig {
  tmnCode: string;
  secretKey: string;
  vnpUrl: string;
}

@Injectable()
export class VnpayService {
  // 🔥 XÓA config cố định từ .env
  // private tmnCode = process.env.VNP_TMN_CODE!;
  // private secretKey = process.env.VNP_SECRET!;
  // private vnpUrl = process.env.VNP_API_URL!;

  createPaymentUrl(
    orderId: number, 
    amount: number, 
    returnUrl: string,
    config: VnpayConfig // 🔥 NHẬN config từ bên ngoài
  ) {
    const date = new Date();
    const createDate = this.formatDate(date);

    let vnp_Params: any = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = config.tmnCode; // 🔥 DÙNG config từ parameter
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId.toString();
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan don hang ' + orderId;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = '127.0.0.1';
    vnp_Params['vnp_CreateDate'] = createDate;

    vnp_Params = this.sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', config.secretKey); // 🔥 DÙNG config
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;

    const paymentUrl = config.vnpUrl + '?' + qs.stringify(vnp_Params, { encode: false }); // 🔥 DÙNG config
    return paymentUrl;
  }

  // Verify callback từ VNPay
  verifyReturnUrl(
    vnpParams: Record<string, string>,
    config: VnpayConfig // 🔥 NHẬN config để verify
  ) {
    const secureHash = vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    const sortedParams = this.sortObject(vnpParams);
    const signData = qs.stringify(sortedParams, { encode: false });
    const checkSum = crypto
      .createHmac('sha512', config.secretKey) // 🔥 DÙNG config
      .update(signData)
      .digest('hex');

    return {
      isValid: secureHash === checkSum,
      orderId: vnpParams['vnp_TxnRef'],
      amount: parseInt(vnpParams['vnp_Amount'], 10) / 100,
      responseCode: vnpParams['vnp_ResponseCode'],
      transactionNo: vnpParams['vnp_TransactionNo'],
      bankCode: vnpParams['vnp_BankCode'],
      payDate: vnpParams['vnp_PayDate'],
    };
  }

  private formatDate(date: Date) {
    const yyyy = date.getFullYear().toString();
    const MM = ('0' + (date.getMonth() + 1)).slice(-2);
    const dd = ('0' + date.getDate()).slice(-2);
    const hh = ('0' + date.getHours()).slice(-2);
    const mm = ('0' + date.getMinutes()).slice(-2);
    const ss = ('0' + date.getSeconds()).slice(-2);
    return `${yyyy}${MM}${dd}${hh}${mm}${ss}`;
  }

  private sortObject(obj: Record<string, any>) {
    const sorted: Record<string, any> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
    }
    return sorted;
  }
}