import React, { memo, useCallback } from "react";
import { View, Text } from "react-native";
import { JettonProductItem } from "./JettonProductItem";
import { useMarkJettonDisabled } from "../../engine/hooks/jettons/useMarkJettonDisabled";
import { useCloudValue, useHintsFull, useNetwork, useTheme } from "../../engine/hooks";
import { CollapsibleCards } from "../animated/CollapsibleCards";
import { PerfText } from "../basic/PerfText";
import { t } from "../../i18n/t";
import { Typography } from "../styles";
import { Address } from "@ton/core";
import { Image } from "expo-image";
import { JettonViewType } from "../../fragments/wallet/AssetsFragment";
import { JettonFull } from "../../engine/api/fetchHintsFull";

const hideIcon = <Image source={require('@assets/ic-hide.png')} style={{ width: 36, height: 36 }} />;

export const JettonsProductComponent = memo(({ owner }: { owner: Address }) => {
    const theme = useTheme();
    const { isTestnet: testOnly } = useNetwork();
    const markJettonDisabled = useMarkJettonDisabled();
    const hints = useHintsFull(owner.toString({ testOnly })).data?.hints ?? [];
    const [disabledState] = useCloudValue<{ disabled: { [key: string]: { reason: string } } }>('jettons-disabled', (src) => { src.disabled = {} });

    const visibleList = hints
        .filter((s) => !disabledState.disabled[s.jetton.address]);

        const renderItem = useCallback((hint: JettonFull) => {
            if (!hint) {
                return null;
            }
            return (
                <JettonProductItem
                    key={'jt' + hint.jetton.address}
                    hint={hint}
                    rightAction={() => markJettonDisabled(hint.jetton.address)}
                    rightActionIcon={hideIcon}
                    card
                    owner={owner}
                    jettonViewType={JettonViewType.Default}
                />
            )
        }, [hideIcon, owner, markJettonDisabled]);

    if (visibleList.length === 0) {
        return null;
    }

    if (visibleList.length < 3) {
        return (
            <View style={{ marginBottom: visibleList.length > 0 ? 16 : 0 }}>
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between', alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        marginBottom: 4
                    }}
                >
                    <Text style={[{ color: theme.textPrimary, }, Typography.semiBold20_28]}>
                        {t('jetton.productButtonTitle')}
                    </Text>
                </View>
                {visibleList.map((hint, index) => {
                    return (
                        <JettonProductItem
                            key={'jt' + hint.jetton.address}
                            hint={hint}
                            first={index === 0}
                            last={index === visibleList.length - 1}
                            rightAction={() => markJettonDisabled(hint.jetton.address)}
                            rightActionIcon={hideIcon}
                            single={visibleList.length === 1}
                            owner={owner}
                            jettonViewType={JettonViewType.Default}
                        />
                    )
                })}
            </View>
        )
    }

    return (
        <View style={{ marginBottom: 16 }}>
            <CollapsibleCards
                title={t('jetton.productButtonTitle')}
                items={visibleList}
                renderItem={renderItem}
                renderFace={() => {
                    return (
                        <View style={[
                            {
                                flexGrow: 1, flexDirection: 'row',
                                padding: 20,
                                marginHorizontal: 16,
                                borderRadius: 20,
                                alignItems: 'center',
                                backgroundColor: theme.surfaceOnBg,
                            },
                            theme.style === 'dark' ? {
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.15,
                                shadowRadius: 4,
                            } : {}
                        ]}>
                            <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0 }}>
                                <Image
                                    source={require('@assets/ic-coins.png')}
                                    style={{ width: 46, height: 46, borderRadius: 23 }}
                                />
                            </View>
                            <View style={{ marginLeft: 12, flexShrink: 1 }}>
                                <PerfText
                                    style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                                    ellipsizeMode="tail"
                                    numberOfLines={1}
                                >
                                    {t('jetton.productButtonTitle')}
                                </PerfText>
                                <PerfText
                                    numberOfLines={1}
                                    ellipsizeMode={'tail'}
                                    style={[{ flexShrink: 1, color: theme.textSecondary }, Typography.regular15_20]}
                                >
                                    <PerfText style={{ flexShrink: 1 }}>
                                        {t('common.showMore')}
                                    </PerfText>
                                </PerfText>
                            </View>
                        </View>
                    )
                }}
                itemHeight={86}
                theme={theme}
                limitConfig={{
                    maxItems: 10,
                    fullList: { type: 'jettons' }
                }}
            />
        </View>
    );
});
JettonsProductComponent.displayName = 'JettonsProductComponent';