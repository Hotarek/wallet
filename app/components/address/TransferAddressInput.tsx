import { ForwardedRef, RefObject, forwardRef, memo, useCallback, useEffect, useMemo, useReducer } from "react";
import { Platform, Pressable, useWindowDimensions, View } from "react-native";
import { ThemeType } from "../../engine/state/theme";
import { Address } from "@ton/core";
import { avatarColors } from "../avatar/Avatar";
import { AddressDomainInput, AnimTextInputRef } from "./AddressDomainInput";
import { ATextInputRef } from "../ATextInput";
import { KnownWallet } from "../../secure/KnownWallets";
import { useAppState, useBounceableWalletFormat, useWalletSettings } from "../../engine/hooks";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { AddressSearchItem } from "./AddressSearch";
import { t } from "../../i18n/t";
import { PerfText } from "../basic/PerfText";
import { avatarHash } from "../../utils/avatarHash";
import { useLedgerTransport } from "../../fragments/ledger/components/TransportContext";
import { AddressInputAvatar } from "./AddressInputAvatar";
import { useDimensions } from "@react-native-community/hooks";
import { TypedNavigation } from "../../utils/useTypedNavigation";
import { useAddressBookContext } from "../../engine/AddressBookContext";
import { useHoldersAccountTrargets } from "../../engine/hooks/holders/useHoldersAccountTrargets";
import { Typography } from "../styles";
import { Image } from "expo-image";

import IcChevron from '@assets/ic_chevron_forward.svg';

import IcChevron from '@assets/ic_chevron_forward.svg';

type TransferAddressInputProps = {
    acc: Address,
    theme: ThemeType,
    validAddress?: Address,
    isTestnet: boolean,
    index: number,
    target: string,
    input: string,
    domain?: string,
    onFocus: (index: number) => void,
    onSubmit: (index: number) => void,
    onQRCodeRead: (value: string) => void,
    isSelected?: boolean,
    onNext?: () => void,
    onSearchItemSelected?: (item: AddressSearchItem) => void,
    knownWallets: { [key: string]: KnownWallet },
    navigation: TypedNavigation,
    setAddressDomainInputState: (state: AddressInputState) => void,
    autoFocus?: boolean,
}

export type AddressInputState = {
    input: string,
    target: string,
    domain: string | undefined,
    suffix: string | undefined
}

export enum InputActionType {
    Input = 'input',
    Target = 'target',
    Domain = 'domain',
    DomainTarget = 'domain-target',
    InputTarget = 'input-target',
    Clear = 'clear',
}

export type AddressInputAction = {
    type: InputActionType.Input,
    input: string,
} | {
    type: InputActionType.Target,
    target: string,
} | {
    type: InputActionType.Domain,
    domain: string | undefined,
} | {
    type: InputActionType.DomainTarget,
    domain: string | undefined,
    target: string,
} | {
    type: InputActionType.InputTarget,
    input: string,
    target: string,
    suffix: string,
} | { type: InputActionType.Clear }

export function addressInputReducer(ref: ForwardedRef<AnimTextInputRef>) {
    return (state: AddressInputState, action: AddressInputAction): AddressInputState => {
        switch (action.type) {
            case InputActionType.Input:
                if (action.input === state.input) {
                    return state;
                }
                try {
                    Address.parse(action.input);
                    return {
                        input: action.input,
                        domain: undefined,
                        target: action.input,
                        suffix: undefined
                    };
                } catch {
                    // ignore
                }
                return {
                    input: action.input,
                    domain: undefined,
                    target: '',
                    suffix: undefined
                };
            case InputActionType.Target:
                return {
                    ...state,
                    target: action.target,
                    suffix: undefined
                };
            case InputActionType.Domain:
                return {
                    ...state,
                    domain: action.domain,
                    suffix: undefined
                };
            case InputActionType.DomainTarget:
                return {
                    ...state,
                    domain: action.domain,
                    target: action.target,
                    suffix: undefined
                };
            case InputActionType.InputTarget:
                return {
                    ...state,
                    input: action.input,
                    target: action.target,
                    suffix: action.suffix
                };
            case InputActionType.Clear:
                (ref as RefObject<AnimTextInputRef>)?.current?.setText('');
                return {
                    input: '',
                    target: '',
                    domain: undefined,
                    suffix: undefined
                };
            default:
                return state;
        }
    }
}

export const TransferAddressInput = memo(forwardRef((props: TransferAddressInputProps, ref: ForwardedRef<AnimTextInputRef>) => {
    const [addressDomainInputState, dispatchAddressDomainInput] = useReducer(
        addressInputReducer(ref),
        {
            input: props?.target || '',
            target: props?.target || '',
            domain: undefined,
            suffix: undefined,
        }
    );

    const isKnown: boolean = !!props.knownWallets[props.target];
    const addressBookContext = useAddressBookContext();
    const contact = addressBookContext.asContact(props.target);
    const appState = useAppState();
    const theme = props.theme;
    const dimentions = useWindowDimensions();
    const screenWidth = dimentions.width;
    const validAddressFriendly = props.validAddress?.toString({ testOnly: props.isTestnet });
    const [walletSettings] = useWalletSettings(validAddressFriendly);
    const [bounceableFormat] = useBounceableWalletFormat();
    const ledgerTransport = useLedgerTransport();

    const holdersAccounts = useHoldersAccountTrargets(appState.addresses[appState.selected].address);
    const isTargetHolders = holdersAccounts.find((acc) => props.validAddress?.equals(acc.address));

    const avatarColorHash = walletSettings?.color ?? avatarHash(validAddressFriendly ?? '', avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];

    const isSelectedLedger = useMemo(() => {
        try {
            if (!!ledgerTransport?.addr?.address && !!props.validAddress) {
                return Address.parse(ledgerTransport.addr.address).equals(props.validAddress);
            }
            return false
        } catch {
            return false;
        }
    }, [ledgerTransport.addr?.address, props.validAddress]);

    const myWallets = useMemo(() => {
        return appState.addresses
            .map((acc, index) => ({
                address: acc.address,
                addressString: acc.address.toString({ testOnly: props.isTestnet }),
                index: index
            }))
            .concat(ledgerTransport.addr ? [
                {
                    address: Address.parse(ledgerTransport.addr.address),
                    addressString: Address.parse(ledgerTransport.addr.address).toString({ testOnly: props.isTestnet }),
                    index: -2
                }
            ] : [])
            .filter((acc) => !acc.address.equals(props.acc))
    }, [appState.addresses, ledgerTransport.addr?.address]);

    const own = !!myWallets.find((acc) => {
        if (props.validAddress) {
            return acc.address.equals(props.validAddress);
        }
    });

    const isSelected = props.isSelected;

    const select = useCallback(() => {
        (ref as RefObject<ATextInputRef>)?.current?.focus();
    }, []);

    useEffect(() => {
        if (isSelected) {
            select();
        }
    }, [select, isSelected]);

    useEffect(() => {
        props.setAddressDomainInputState(addressDomainInputState);
    }, [addressDomainInputState]);

    // set input value on mount
    useEffect(() => {
        (ref as RefObject<AnimTextInputRef>)?.current?.setText(addressDomainInputState.input);
    }, []);

    const onAddressSearchItemSelected = useCallback((item: AddressSearchItem) => {
        const friendly = item.addr.address.toString({
            testOnly: props.isTestnet,
            bounceable: item.known ? true : item.addr.isBounceable
        });

        let name = item.type !== 'unknown' ? item.title : friendly;

        if (item.isLedger) {
            name = 'Ledger';
        }

        const suff = friendly.slice(0, 4) + '...' + friendly.slice(friendly.length - 4);

        dispatchAddressDomainInput({
            type: InputActionType.InputTarget,
            input: name.trim(),
            target: friendly,
            suffix: suff
        });

        (ref as RefObject<AnimTextInputRef>)?.current?.setText(name.trim());

        if (props.onSearchItemSelected) {
            props.onSearchItemSelected(item);
        }
    }, [props.onSearchItemSelected]);

    const openAddressBook = useCallback(() => {
        props.navigation.navigate('AddressBook', {
            account: props.acc.toString({ testOnly: props.isTestnet }),
            onSelected: onAddressSearchItemSelected
        });
    }, [onAddressSearchItemSelected]);

    return (
        <View>
            <View
                style={[isSelected ? { opacity: 0, height: 0, width: 0 } : undefined]}
                pointerEvents={!isSelected ? undefined : 'none'}
            >
                <Pressable
                    style={{
                        backgroundColor: props.theme.surfaceOnElevation,
                        padding: 20,
                        width: '100%', borderRadius: 20,
                        flexDirection: 'row', alignItems: 'center',
                    }}
                    onPress={select}
                >
                    <AddressInputAvatar
                        size={46}
                        theme={theme}
                        isTestnet={props.isTestnet}
                        isOwn={own}
                        markContact={!!contact}
                        hash={walletSettings?.avatar}
                        isLedger={isSelectedLedger}
                        friendly={validAddressFriendly}
                        avatarColor={avatarColor}
                        knownWallets={props.knownWallets}
                        forceAvatar={isTargetHolders ? 'holders' : undefined}
                    />
                    <View style={{ paddingHorizontal: 12, flexGrow: 1 }}>
                        <PerfText style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                            {t('common.recipient')}
                        </PerfText>
                        <PerfText style={[{ color: theme.textPrimary, marginTop: 2 }, Typography.regular17_24]}>
                            {props.target.slice(0, 4) + '...' + props.target.slice(-4)}
                        </PerfText>
                    </View>
                    <IcChevron style={{ height: 12, width: 12 }} height={12} width={12} />
                </Pressable>
            </View>
            <View
                style={
                    !isSelected
                        ? Platform.select({
                            ios: { width: 0, height: 0, opacity: 0 },
                            android: { height: 1, opacity: 0 } // to account for wierd android behavior (not focusing on input when it's height/width is 0)
                        })
                        : { height: 'auto', width: '100%', opacity: 1 }
                }
                pointerEvents={isSelected ? undefined : 'none'}
            >
                <View
                    style={{
                        backgroundColor: props.theme.surfaceOnElevation,
                        paddingVertical: 20,
                        paddingHorizontal: 20,
                        width: '100%', borderRadius: 20,
                        flexDirection: 'row', alignItems: 'center',
                        gap: 16
                    }}
                >
                    <AddressInputAvatar
                        size={46}
                        theme={theme}
                        isTestnet={props.isTestnet}
                        isOwn={own}
                        markContact={!!contact}
                        hash={walletSettings?.avatar}
                        isLedger={isSelectedLedger}
                        friendly={validAddressFriendly}
                        avatarColor={avatarColor}
                        knownWallets={props.knownWallets}
                        forceAvatar={isTargetHolders ? 'holders' : undefined}
                    />
                    <AddressDomainInput
                        input={addressDomainInputState.input}
                        dispatch={dispatchAddressDomainInput}
                        target={props.target}
                        index={props.index}
                        ref={ref}
                        autoFocus={props.autoFocus}
                        onFocus={props.onFocus}
                        isKnown={isKnown}
                        onSubmit={props.onSubmit}
                        contact={contact}
                        onQRCodeRead={props.onQRCodeRead}
                        domain={props.domain}
                        screenWidth={screenWidth * 0.75}
                        bounceableFormat={bounceableFormat}
                        knownWallets={props.knownWallets}
                        navigation={props.navigation}
                        theme={theme}
                        isTestnet={props.isTestnet}
                        rightAction={(
                            <Pressable
                                style={({ pressed }) => ({
                                    opacity: pressed ? 0.5 : 1
                                })}
                                onPress={openAddressBook}
                                hitSlop={4}
                            >
                                <Image
                                    source={require('@assets/ic-address-book.png')}
                                    style={{ height: 24, width: 24, tintColor: theme.accent }}
                                />
                            </Pressable>
                        )}
                        suffix={addressDomainInputState.suffix}
                    />
                </View>
                {!props.validAddress && (props.target.length >= 48) && (
                    <Animated.View entering={FadeIn} exiting={FadeOut}>
                        <PerfText style={[{
                            color: theme.accentRed,
                            marginTop: 4,
                            marginLeft: 16,
                        }, Typography.regular13_18]}>
                            {t('transfer.error.invalidAddress')}
                        </PerfText>
                    </Animated.View>
                )}
            </View>
        </View>
    );
}));

TransferAddressInput.displayName = 'TransferAddressInput';