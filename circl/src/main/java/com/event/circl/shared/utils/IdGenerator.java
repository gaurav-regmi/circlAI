package com.event.circl.shared.utils;

import io.hypersistence.tsid.TSID;

public class IdGenerator {
    private IdGenerator() {}

    public static String generateString() {
        return TSID.Factory.getTsid().toString();
    }
}
