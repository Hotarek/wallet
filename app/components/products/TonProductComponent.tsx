import { memo, useCallback } from "react";
import { Pressable, View, Text } from "react-native";
import { ThemeType } from "../../engine/state/theme";
import { ValueComponent } from "../ValueComponent";
import { Typography } from "../styles";
import { PriceComponent } from "../PriceComponent";
import { Address } from "@ton/core";
import { useAccountLite, useBounceableWalletFormat } from "../../engine/hooks";
import { Image } from "expo-image";
import { useTypedNavigation } from "../../utils/useTypedNavigation";

export const TonProductComponent = memo(({
    theme,
    isLedger,
    address,
    testOnly
}: {
    theme: ThemeType,
    isLedger?: boolean,
    address: Address,
    testOnly?: boolean,
}) => {
    const navigation = useTypedNavigation();
    const accountLite = useAccountLite(address);
    const balance = accountLite?.balance ?? 0n;
    const [bounceableFormat] = useBounceableWalletFormat();
    const ledgerAddressStr = address?.toString({ bounceable: bounceableFormat, testOnly });

    const onTonPress = useCallback(() => {
        if (balance === 0n) {
            if (isLedger) {
                navigation.navigate('LedgerReceive', { addr: ledgerAddressStr, ledger: true });
            } else {
                navigation.navigate('Receive');
            }
            return;
        }

        navigation.navigate(isLedger ? 'LedgerSimpleTransfer' : 'SimpleTransfer');
    }, [ledgerAddressStr, balance]);

    return (
        <Pressable
            style={({ pressed }) => {
                return { flex: 1, opacity: pressed ? 0.8 : 1 }
            }}
            onPress={onTonPress}
        >
            <View style={{
                flexDirection: 'row', flexGrow: 1,
                alignItems: 'center',
                padding: 20,
                backgroundColor: theme.surfaceOnBg,
                borderRadius: 20,
                overflow: 'hidden'
            }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0 }}>
                    <Image
                        source={require('@assets/ic-ton-acc.png')}
                        style={{
                            borderRadius: 23,
                            height: 46,
                            width: 46
                        }}
                    />
                    <View style={{
                        justifyContent: 'center', alignItems: 'center',
                        height: 20, width: 20, borderRadius: 10,
                        position: 'absolute', right: -2, bottom: -2,
                        backgroundColor: theme.surfaceOnBg
                    }}>
                        <Image
                            source={require('@assets/ic-verified.png')}
                            style={{ height: 20, width: 20 }}
                        />
                    </View>
                </View>
                <View style={{ marginLeft: 12, flexShrink: 1 }}>
                    <Text
                        style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                        ellipsizeMode="tail"
                        numberOfLines={1}
                    >
                        {'TON'}
                    </Text>
                    <Text
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                        style={[{ color: theme.textSecondary }, Typography.regular15_20]}
                    >
                        {'The Open Network'}
                    </Text>
                </View>
                <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
                    <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                        <ValueComponent value={balance} precision={2} centFontStyle={{ color: theme.textSecondary }} />
                        <Text style={{ color: theme.textSecondary, fontSize: 15 }}>{' TON'}</Text>
                    </Text>
                    <PriceComponent
                        amount={balance}
                        style={{
                            backgroundColor: 'transparent',
                            paddingHorizontal: 0, paddingVertical: 0,
                            alignSelf: 'flex-end',
                            height: undefined,
                        }}
                        textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                        theme={theme}
                        hideCentsIfNull
                    />
                </View>
            </View>
        </Pressable>
    );
});