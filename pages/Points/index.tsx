import React, { useState, useEffect } from "react";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { Feather } from "@expo/vector-icons";
import {
	StyleSheet,
	View,
	ScrollView,
	Text,
	TouchableOpacity,
	Image,
	Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import { SvgUri } from "react-native-svg";
import api from "../../services/api";

interface Item {
	id: number;
	title: string;
	image_url: string;
}
interface Point {
	id: number;
	image: string;
	image_url: string;
	name: string;
	latitude: number;
	longitude: number;
}
interface Params {
	uf: string;
	city: string;
}

const Points = () => {
	const [items, setItems] = useState<Item[]>([
		{ id: 0, title: "", image_url: "" },
	]);
	const [points, setPoints] = useState<Point[]>([]);
	const [selectedItems, setSelectedItems] = useState<number[]>([]);
	const [initialPosition, setInitialPosition] = useState<[number, number]>();
	const navigation = useNavigation();
	const route = useRoute();

	const routeParams = route.params as Params;

	useEffect(() => {
		async function loadPosition() {
			const { status } = await Location.requestPermissionsAsync();
			if (status !== "granted") {
				Alert.alert(
					"Atenção!",
					"Precisamos de autorização para obter sua localização.",
				);
				return;
			}

			const location = await Location.getCurrentPositionAsync();
			const { latitude, longitude } = location.coords;
			setInitialPosition([latitude, longitude]);
		}
		loadPosition();
	}, []);

	useEffect(() => {
		async function fetchData() {
			try {
				const { data } = await api.get("items");
				setItems(data);
			} catch (err) {
				console.log(err);
			}
		}
		fetchData();
	}, []);

	useEffect(() => {
		async function fetchData() {
			const { data } = await api.get("points", {
				params: {
					city: routeParams.city,
					uf: routeParams.uf,
					items: selectedItems,
				},
			});
			setPoints(data);
		}
		fetchData();
	}, [selectedItems]);

	function handleSelectItem(id: number) {
		const alreadySelected = selectedItems.findIndex((item) => item === id) >= 0;

		if (alreadySelected) {
			const filteredItems = selectedItems.filter((item) => item !== id);
			setSelectedItems(filteredItems);
		} else {
			setSelectedItems([...selectedItems, id]);
		}
	}
	return (
		<>
			<View style={styles.container}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Feather name="arrow-left" size={20} color="#34cb79" />
				</TouchableOpacity>

				<Text style={styles.title}>Bem-vindo.</Text>
				<Text style={styles.description}>
					Encontre no mapa um ponto de coleta.
				</Text>
				<View style={styles.mapContainer}>
					{initialPosition && (
						<MapView
							initialRegion={{
								latitude: initialPosition[0] || -22.890242,
								longitude: initialPosition[1] || -42.042095,
								latitudeDelta: 0.014,
								longitudeDelta: 0.014,
							}}
							style={styles.map}>
							{points.map((point) => (
								<Marker
									key={String(point.id)}
									onPress={() =>
										navigation.navigate("Detail", {
											point_id: point.id,
											availableItems: items.map((item) => {
												if (selectedItems.includes(item.id)) return item.title;
											}),
										})
									}
									style={styles.mapMarker}
									coordinate={{
										latitude: point.latitude,
										longitude: point.longitude,
									}}>
									<View style={styles.mapMarkerContainer}>
										<Image
											style={styles.mapMarkerImage}
											source={{
												uri: point.image_url,
											}}
										/>
										<Text style={styles.mapMarkerTitle}>{point.name}</Text>
									</View>
								</Marker>
							))}
						</MapView>
					)}
				</View>
			</View>
			<View style={styles.itemsContainer}>
				<ScrollView
					contentContainerStyle={{ paddingHorizontal: 30 }}
					horizontal
					showsHorizontalScrollIndicator={false}>
					{items.map((item) => (
						<TouchableOpacity
							activeOpacity={0.7}
							key={item.id}
							style={[
								styles.item,
								selectedItems.includes(item.id) ? styles.selectedItem : {},
							]}
							onPress={() => handleSelectItem(item.id)}>
							<SvgUri width={42} height={42} uri={item.image_url} />
							<Text style={styles.itemTitle}>{item.title}</Text>
						</TouchableOpacity>
					))}
				</ScrollView>
			</View>
		</>
	);
};

export default Points;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 32,
		paddingTop: 20 + Constants.statusBarHeight,
	},

	title: {
		fontSize: 20,
		fontFamily: "Ubuntu_700Bold",
		marginTop: 24,
	},

	description: {
		color: "#6C6C80",
		fontSize: 16,
		marginTop: 4,
		fontFamily: "Roboto_400Regular",
	},

	mapContainer: {
		flex: 1,
		width: "100%",
		borderRadius: 10,
		overflow: "hidden",
		marginTop: 16,
	},

	map: {
		width: "100%",
		height: "100%",
	},

	mapMarker: {
		width: 90,
		height: 80,
	},

	mapMarkerContainer: {
		width: 90,
		height: 70,
		backgroundColor: "#34CB79",
		flexDirection: "column",
		borderRadius: 8,
		overflow: "hidden",
		alignItems: "center",
	},

	mapMarkerImage: {
		width: 90,
		height: 45,
		resizeMode: "cover",
	},

	mapMarkerTitle: {
		flex: 1,
		fontFamily: "Roboto_400Regular",
		color: "#FFF",
		fontSize: 13,
		lineHeight: 23,
	},

	itemsContainer: {
		flexDirection: "row",
		marginTop: 16,
		marginBottom: 32,
	},

	item: {
		backgroundColor: "#fff",
		borderWidth: 2,
		borderColor: "#eee",
		height: 120,
		width: 120,
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingTop: 20,
		paddingBottom: 16,
		marginRight: 8,
		alignItems: "center",
		justifyContent: "space-between",

		textAlign: "center",
	},

	selectedItem: {
		borderColor: "#34CB79",
		borderWidth: 2,
	},

	itemTitle: {
		fontFamily: "Roboto_400Regular",
		textAlign: "center",
		fontSize: 13,
	},
});
