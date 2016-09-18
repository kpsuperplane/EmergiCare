package com.bitgriff.androidcalls;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;
import android.widget.Toast;
import android.util.Log;
/**
 * Helper class to detect incoming and outgoing calls.
 * @author Moskvichev Andrey V.
 *
 */
public class CallHelper {
	public String number;
	/**
	 * Broadcast receiver to detect the outgoing calls.
	 */
	public class OutgoingReceiver extends BroadcastReceiver {
		public OutgoingReceiver() {
		}

		@Override
		public void onReceive(Context context, Intent intent) {
			number = intent.getStringExtra(Intent.EXTRA_PHONE_NUMBER);
			Log.i("HI",number);
			Toast.makeText(ctx,
					"Outgoing: "+number,
					Toast.LENGTH_LONG).show();
			if(number.equals("611")){
				//Intent intent2 = new Intent(ctx, Loc.class);
				Intent intent2 = new Intent(ctx, EnhancedLocationService.class);
				Intent intent3 = new Intent(ctx, CallDetectService.class);
				Log.i("HELLO",number);
				ctx.stopService(intent3);
				ctx.startService(intent2);
			}
		}

	}

	private Context ctx;
	private OutgoingReceiver outgoingReceiver;

	public CallHelper(Context ctx) {
		this.ctx = ctx;
		outgoingReceiver = new OutgoingReceiver();
	}

	/**
	 * Start calls detection.
	 */
	public void start() {

		IntentFilter intentFilter = new IntentFilter(Intent.ACTION_NEW_OUTGOING_CALL);
		ctx.registerReceiver(outgoingReceiver, intentFilter);
	}

	/**
	 * Stop calls detection.
	 */
	public void stop() {
		ctx.unregisterReceiver(outgoingReceiver);
	}

}