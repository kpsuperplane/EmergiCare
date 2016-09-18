package com.bitgriff.androidcalls;

import android.content.Context;
import android.location.Location;
import com.google.android.gms.location.LocationListener;
import android.os.Bundle;
import android.util.Log;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.LocationServices;

/**
 * Created by dianachang on 2016-09-18.
 */

public class FusedLocationListener implements LocationListener,
        GoogleApiClient.ConnectionCallbacks,
        GoogleApiClient.OnConnectionFailedListener {

    private String TAG = "AYYYY";

    @Override
    public void onLocationChanged(Location location) {
        Log.d(TAG, "Firing onLocationChanged..............................................");
    }


    @Override
    public void onConnected(Bundle bundle) {

    }

    @Override
    public void onConnectionSuspended(int i) {

    }

    @Override
    public void onConnectionFailed(ConnectionResult connectionResult) {

    }
}