
///////////////////////////////

package com.bitgriff.androidcalls;

        import android.app.Service;
        import android.content.Context;
        import android.content.Intent;
        import android.location.Location;
        import android.location.LocationListener;
        import android.location.LocationManager;
        import android.os.Bundle;
        import android.os.IBinder;
        import android.telephony.SmsManager;
        import android.util.Log;
        import android.widget.Toast;
public class Loc extends Service
{
    private static final String TAG = "BOOMBOOMTESTGPS";
    private LocationManager mLocationManager = null;
    private static final int LOCATION_INTERVAL = 100;
        private static final float LOCATION_DISTANCE = 0f;
    public int counter = 0;
    //new

    private class LocationListener implements android.location.LocationListener{
        Location mLastLocation;
        public LocationListener(String provider)
        {
            Log.e(TAG, "LocationListener " + provider);
            mLastLocation = new Location(provider);
        }
        public void onLocationChanged(Location location) {

            Log.e(TAG, "booo");
            if (counter==0){
                counter++;
                textMe(location.getLatitude()+";"+location.getLongitude()+";"+location.getAccuracy()+";0");
            }
            else{
                textMe(location.getLatitude()+";"+location.getLongitude()+";"+location.getAccuracy()+";1");

            }

        }

        @Override
        public void onProviderDisabled(String provider) {
            Log.i(TAG, "disabled!");
            // TODO Auto-generated method stub
        }
        @Override
        public void onProviderEnabled(String provider) {
            Log.i(TAG, "enabled!");
            // TODO Auto-generated method stub
        }
        @Override
        public void onStatusChanged(String provider, int status,
                                    Bundle extras) {
            Log.i(TAG, "Status changed!");
            // TODO Auto-generated method stub
        }
    };

    public void textMe(String location){
        try {
            SmsManager smsManager = SmsManager.getDefault();
            smsManager.sendTextMessage("5878051020", null, location, null, null);
            Toast.makeText(getApplicationContext(), "SMS Sent!",
                    Toast.LENGTH_LONG).show();
        } catch (Exception e) {
            Toast.makeText(getApplicationContext(),
                    "SMS faild, please try again later!",
                    Toast.LENGTH_LONG).show();
            e.printStackTrace();
        }
    }
    LocationListener[] mLocationListeners = new LocationListener[] {
            new LocationListener(LocationManager.GPS_PROVIDER),
            new LocationListener(LocationManager.NETWORK_PROVIDER)
    };
    @Override
    public IBinder onBind(Intent arg0) {return null;}
    @Override
    public int onStartCommand(Intent intent, int flags, int startId)
    {
        Log.e(TAG, "onStartCommand");
        super.onStartCommand(intent, flags, startId);
        return START_STICKY;
    }
    @Override
    public void onCreate()
    {
        Log.e(TAG, "onCreate");
        LocationManager locationManager = (LocationManager) getApplicationContext().getSystemService(Context.LOCATION_SERVICE);

        try {
            mLocationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER, LOCATION_INTERVAL, LOCATION_DISTANCE,
                    mLocationListeners[1]);
        } catch (java.lang.SecurityException ex) {
            Log.i(TAG, "fail to request location update, ignore", ex);
        } catch (IllegalArgumentException ex) {
            Log.d(TAG, "network provider does not exist, " + ex.getMessage());
        }
        try {
            mLocationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER, LOCATION_INTERVAL, LOCATION_DISTANCE,
                    mLocationListeners[0]);
        } catch (java.lang.SecurityException ex) {
            Log.i(TAG, "fail to request location update, ignore", ex);
        } catch (IllegalArgumentException ex) {
            Log.d(TAG, "gps provider does not exist " + ex.getMessage());
        }
    }
    @Override
    public void onDestroy()
    {
        Log.e(TAG, "onDestroy");
        super.onDestroy();
        if (mLocationManager != null) {
            for (int i = 0; i < mLocationListeners.length; i++) {
                try {
                    mLocationManager.removeUpdates(mLocationListeners[i]);
                } catch (Exception ex) {
                    Log.i(TAG, "fail to remove location listners, ignore", ex);
                }
            }
        }
    }

    private void initializeLocationManager() {
        Log.e(TAG, "initializeLocationManager");

        LocationManager locationManager = (LocationManager) getApplicationContext().getSystemService(Context.LOCATION_SERVICE);
        Location lastKnownLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);

        //Log.e("LOCATION",lastKnownLocation+"");
        if (mLocationManager == null) {
            mLocationManager = (LocationManager) getApplicationContext().getSystemService(Context.LOCATION_SERVICE);
        }
    }


    /////////////////////////////////////
    /////////////////////////////////////

    private static final int TWO_MINUTES = 1000 * 60 * 2;

    /** Determines whether one Location reading is better than the current Location fix
     * @param location  The new Location that you want to evaluate
     * @param currentBestLocation  The current Location fix, to which you want to compare the new one
     */
    protected boolean isBetterLocation(Location location, Location currentBestLocation) {
        if (currentBestLocation == null) {
            // A new location is always better than no location
            return true;
        }

        // Check whether the new location fix is newer or older
        long timeDelta = location.getTime() - currentBestLocation.getTime();
        boolean isSignificantlyNewer = timeDelta > TWO_MINUTES;
        boolean isSignificantlyOlder = timeDelta < -TWO_MINUTES;
        boolean isNewer = timeDelta > 0;

        // If it's been more than two minutes since the current location, use the new location
        // because the user has likely moved
        if (isSignificantlyNewer) {
            return true;
            // If the new location is more than two minutes older, it must be worse
        } else if (isSignificantlyOlder) {
            return false;
        }

        // Check whether the new location fix is more or less accurate
        int accuracyDelta = (int) (location.getAccuracy() - currentBestLocation.getAccuracy());
        boolean isLessAccurate = accuracyDelta > 0;
        boolean isMoreAccurate = accuracyDelta < 0;
        boolean isSignificantlyLessAccurate = accuracyDelta > 200;

        // Check if the old and new location are from the same provider
        boolean isFromSameProvider = isSameProvider(location.getProvider(),
                currentBestLocation.getProvider());

        // Determine location quality using a combination of timeliness and accuracy
        if (isMoreAccurate) {
            return true;
        } else if (isNewer && !isLessAccurate) {
            return true;
        } else if (isNewer && !isSignificantlyLessAccurate && isFromSameProvider) {
            return true;
        }
        return false;
    }

    /** Checks whether two providers are the same */
    private boolean isSameProvider(String provider1, String provider2) {
        if (provider1 == null) {
            return provider2 == null;
        }
        return provider1.equals(provider2);
    }
}