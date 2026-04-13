package com.event.circl.shared.utils;

public class AssertUtil {
    private AssertUtil() {}

    public static <T> T requireNotNull(T obj, String message) {
        if (obj == null) throw new IllegalArgumentException(message);
        return obj;
    }

    public static String requireNotBlank(String str, String message) {
        if (str == null || str.trim().isBlank()) throw new IllegalArgumentException(message);
        return str;
    }
}
