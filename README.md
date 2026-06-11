# Geospatial Projection Attribute Extension for Zarr

- **UUID**: f17cb550-5864-4468-aeb7-f3180cfb622f
- **Name**: proj
- **Namespace**: `proj:`
- **Schema URL**: <https://raw.githubusercontent.com/zarr-conventions/proj/refs/tags/v1/schema.json>
- **Spec URL**: <https://github.com/zarr-conventions/proj/blob/v1/README.md>
- **Extension Maturity Classification**: Proposal
- **Owner**: @emmanuelmathot, @maxrjones


## Description

This convention defines properties that encode datum and coordinate reference system (CRS) information for geospatial data. All properties use the `proj:` namespace prefix and are placed at the root `attributes` level following the [Zarr Conventions Specification](https://github.com/zarr-conventions/zarr-conventions-spec).

This convention focuses solely on CRS definitions. For spatial coordinate information (bounding box, transform, shape, dimensions), compose this convention with the [`spatial` convention](https://github.com/zarr-conventions/spatial). This modular design enables:

- Use of CRS information independently for geospatial data
- Composability with other conventions such as multiscales and spatial
- Cleaner separation of concerns between coordinate systems and coordinate transformations

- Examples:
    - [EPSG:26711](examples/epsg26711.json)
    - [EPSG:3857](examples/epsg3587.json)
    - [wkt2](examples/wkt2.json)
    - [composition with multiscales](examples/multiscales.json)

## Motivation

- Provides simple, standardized CRS encoding without complex nested structures
- Compatible with existing geospatial tools (GDAL, rasterio, pyproj)
- Modular design - focuses solely on CRS definitions, composable with spatial coordinate conventions
- Enables composability - can extend other conventions like multiscales with CRS information

## Inheritance Model

The `proj` convention follows a simple group-to-array inheritance model:

### Inheritance Rules

1. **Group-level definition** (recommended): When `proj` convention is defined at the group level, it applies to all arrays that are direct children of that group. It does not apply to groups or arrays deeper in the hierarchy (e.g., grandchildren).
2. **Array-level override**: An array can override the group's `proj` convention with its own CRS definition.

## Convention Registration

The convention must be registered in `zarr_conventions`:

```json
{
  "zarr_conventions": [
    {
      "schema_url": "https://raw.githubusercontent.com/zarr-conventions/proj/refs/tags/v1/schema.json",
      "spec_url": "https://github.com/zarr-conventions/proj/blob/v1/README.md",
      "uuid": "f17cb550-5864-4468-aeb7-f3180cfb622f",
      "name": "proj",
      "description": "Coordinate reference system information for geospatial data"
    }
  ]
}
```

## Applicable To

This convention can be used with these parts of the Zarr hierarchy:

- [x] Group
- [x] Array

## Properties

All properties use the `proj:` namespace prefix and are placed at the root `attributes` level.

|Property|Type|Description|Required|Reference|
|---|---|---|---|---|
|**proj:code**|`string`|Authority:code identifier (e.g., EPSG:4326)|Conditional*|[proj:code](#projcode)|
|**proj:wkt2**|`string`|WKT2 (ISO 19162) CRS representation|Conditional*|[proj:wkt2](#projwkt2)|
|**proj:projjson**|`object`|PROJJSON CRS representation|Conditional*|[proj:projjson](#projprojjson)|

\* At least one of `proj:code`, `proj:wkt2`, or `proj:projjson` MUST be provided.

**Note**: For spatial coordinate information (bounding box, transform, shape, dimensions), use the [`spatial` convention](https://github.com/zarr-conventions/spatial) in composition with this convention.


### Field Details

Additional properties are allowed.

#### proj:code

Authority:code identifier (e.g., EPSG:4326)

* **Type**: `string | null`
* **Required**: No
* **Pattern**: `^[A-Z]+:[0-9]+$`

Projection codes are identified by a string. The [proj](https://org/) library defines projections
using "authority:code", e.g., "EPSG:4326" or "IAU_2015:30100". Different projection authorities may define
different string formats. Examples of known projection authorities, where when can find well known codes that
clients are likely to support are listed in the following table.

| Authority Name                          | URL                                                        |
| --------------------------------------- | ---------------------------------------------------------- |
| European Petroleum Survey Groups (EPSG) | <http://www.opengis.net/def/crs/EPSG> or <http://epsg.org> |
| International Astronomical Union (IAU)  | <http://www.opengis.net/def/crs/IAU>                       |
| Open Geospatial Consortium (OGC)        | <http://www.opengis.net/def/crs/OGC>                       |
| ESRI                                    | <https://spatialreference.org/ref/esri/>                   |

The `proj:code` field SHOULD be set to `null` or omitted in the following cases:

- The data does not have a CRS, such as in the case of non-rectified imagery with Ground Control Points.
- A CRS exists, but there is no valid EPSG code for it. In this case, the CRS should be provided in `proj:wkt2` and/or `proj:projjson`.

At least one of `proj:code`, `proj:wkt2`, or `proj:projjson` MUST be provided.

#### proj:wkt2

WKT2 (ISO 19162) CRS representation

* **Type**: `string | null`
* **Required**: No

A Coordinate Reference System (CRS) is the data reference system (sometimes called a 'projection')
used by the asset data. This value is a [WKT2](http://docs.opengeospatial.org/is/12-063r5/12-063r5.html) string.

This field SHOULD be set to `null` or omitted in the following cases:

- The asset data does not have a CRS, such as in the case of non-rectified imagery with Ground Control Points.
- A CRS exists, but there is no valid WKT2 string for it.

At least one of `proj:code`, `proj:wkt2`, or `proj:projjson` MUST be provided.

#### proj:projjson

PROJJSON CRS representation

* **Type**: `object | null`
* **Required**: No

A Coordinate Reference System (CRS) is the data reference system (sometimes called a 'projection')
used by the asset data. This value is a [PROJJSON](https://org/specifications/projjson.html) object,
see the [JSON Schema](https://org/schemas/v0.7/projjson.schema.json) for details.

This field SHOULD be set to `null` or omitted in the following cases:

- The asset data does not have a CRS, such as in the case of non-rectified imagery with Ground Control Points.
- A CRS exists, but there is no valid PROJJSON for it.

At least one of `proj:code`, `proj:wkt2`, or `proj:projjson` MUST be provided.

## Recommendations

The `proj` convention allows one or more CRS representations to be present simultaneously. The following
guidance promotes interoperability across different client environments.

### For writers

- SHOULD always include `proj:wkt2`, as it is a self-contained, lossless CRS representation that requires
  no external database for resolution and is widely supported.
- MAY include `proj:code` alongside `proj:wkt2` when a well-known authority code exists, to aid human
  readability and to support clients that can resolve codes efficiently from a local database. Note that
  resolving an authority code may require a network request or a local PROJ database, so it SHOULD NOT be
  the only representation provided.
- MAY additionally include `proj:projjson` for JSON-native consumers.
- When multiple representations are provided, writers are responsible for ensuring that all
  representations describe the same CRS. Inconsistent representations constitute a data quality error.

### For readers

- When multiple representations are present, readers may choose whichever representation best suits their
  environment (e.g., `proj:code` for efficiency when a local CRS database is available; `proj:wkt2` or
  `proj:projjson` for self-contained resolution without an external database).
- Readers are not required to validate consistency across representations. Writers bear responsibility
  for providing equivalent alternatives, following the principle established by the CF Conventions:
  _"the onus is on data producers to ensure that their property values are consistent"_.
- If a discrepancy between representations is detected, the `proj:wkt2` representation takes precedence. This indicates a data quality issue on the
  writer's side. Readers SHOULD 
  surface the inconsistency and advise users to report it to the data provider.

## Examples

### Basic Usage

The `proj` convention defines only the coordinate reference system. For complete geospatial metadata, compose it with the [`spatial` convention](https://github.com/zarr-conventions/spatial):

```json
{
  "zarr_format": 3,
  "node_type": "array",
  "attributes": {
    "zarr_conventions": [
      {
        "schema_url": "https://raw.githubusercontent.com/zarr-conventions/proj/refs/tags/v1/schema.json",
        "spec_url": "https://github.com/zarr-conventions/proj/blob/v1/README.md",
        "uuid": "f17cb550-5864-4468-aeb7-f3180cfb622f",
        "name": "proj",
        "description": "Coordinate reference system information for geospatial data"
      },
      {
        "schema_url": "https://raw.githubusercontent.com/zarr-conventions/spatial/refs/tags/v1/schema.json",
        "spec_url": "https://github.com/zarr-conventions/spatial/blob/v1/README.md",
        "uuid": "689b58e2-cf7b-45e0-9fff-9cfc0883d6b4",
        "name": "spatial",
        "description": "Spatial coordinate information"
      }
    ],
    "proj:code": "EPSG:3857",
    "spatial:dimensions": ["Y", "X"],
    "spatial:bbox": [
      -20037508.342789244,
      -20037508.342789244,
      20037508.342789244,
      20037508.342789244
    ],
    "spatial:transform": [
      156543.03392804097,
      0.0,
      -20037508.342789244,
      0.0,
      -156543.03392804097,
      20037508.342789244
    ]
  }
}
```

See the following examples for different CRS specifications:

- [examples/epsg3587.json](examples/epsg3587.json) - Web Mercator projection with EPSG code
- [examples/epsg26711.json](examples/epsg26711.json) - UTM projection
- [examples/wkt2.json](examples/wkt2.json) - CRS defined using WKT2 format

### Composability with Multiscales and Spatial

The `proj` convention can be composed with both `multiscales` and `spatial` conventions. The CRS is typically defined once at the group level, while spatial coordinate properties vary per resolution level.

**Important:** When `spatial:transform` is present at a resolution level, it represents the **complete affine transformation** for that level. The multiscales `scale` and `translation` properties are used for **array resampling relationships** between levels, not for geospatial coordinate transformations. `spatial:transform` should be treated as the authoritative geospatial transformation, independent of the multiscales resampling parameters.

Example:

```json
{
  "zarr_conventions": [
    {
      "schema_url": "https://raw.githubusercontent.com/zarr-conventions/multiscales/refs/tags/v1/schema.json",
      "spec_url": "https://github.com/zarr-conventions/multiscales/blob/v1/README.md",
      "uuid": "d35379db-88df-4056-af3a-620245f8e347",
      "name": "multiscales",
      "description": "Multiscale layout of zarr datasets"
    },
    {
      "schema_url": "https://raw.githubusercontent.com/zarr-conventions/proj/refs/tags/v1/schema.json",
      "spec_url": "https://github.com/zarr-conventions/proj/blob/v1/README.md",
      "uuid": "f17cb550-5864-4468-aeb7-f3180cfb622f",
      "name": "proj",
      "description": "Coordinate reference system information for geospatial data"
    },
    {
      "schema_url": "https://raw.githubusercontent.com/zarr-conventions/spatial/refs/tags/v1/schema.json",
      "spec_url": "https://github.com/zarr-conventions/spatial/blob/v1/README.md",
      "uuid": "689b58e2-cf7b-45e0-9fff-9cfc0883d6b4",
      "name": "spatial",
      "description": "Spatial coordinate information"
    }
  ],
  "multiscales": {
    "layout": [
      {
        "asset": "r10m",
        "transform": {
          "scale": [1.0, 1.0],
          "translation": [0.0, 0.0]
        },
        "spatial:shape": [1200, 1200],
        "spatial:transform": [10.0, 0.0, 500000.0, 0.0, -10.0, 5000000.0]
      },
      {
        "asset": "r20m",
        "derived_from": "r10m",
        "transform": {
          "scale": [2.0, 2.0],
          "translation": [0.0, 0.0]
        },
        "spatial:shape": [600, 600],
        "spatial:transform": [20.0, 0.0, 500000.0, 0.0, -20.0, 5000000.0]
      }
    ]
  },
  "proj:code": "EPSG:32633",
  "spatial:dimensions": ["Y", "X"],
  "spatial:bbox": [500000.0, 4900000.0, 600000.0, 5000000.0]
}
```

In this example:

- The group-level `proj:code` defines the CRS for all resolution levels
- The group-level `spatial:dimensions` and `spatial:bbox` apply to all resolution levels
- Each layout item has its own `spatial:shape` and `spatial:transform` specific to that resolution
- The multiscales convention defines the relative transformations between levels via the `transform` object
- This separation keeps CRS information (`proj`) independent from spatial coordinate information (`spatial`)

See [examples/multiscales.json](examples/multiscales.json) for a complete composability example.

## FAQ

### Why are `proj` and `spatial` separate conventions?

As explained in the [rasterio documentation](https://rasterio.readthedocs.io/): "There are two parts to the georeferencing of raster datasets: the definition of the local, regional, or global system in which a raster's pixels are located; and the parameters by which pixel coordinates are transformed into coordinates in that system."

This fundamental distinction motivated the design decision ([zarr-conventions issue #9](https://github.com/zarr-conventions/zarr-conventions/issues/9)) to separate these concerns into two conventions:

1. **`proj`** - Defines the coordinate reference system (CRS): the "local, regional, or global system" using EPSG codes, WKT2, or PROJJSON
2. **`spatial`** - Defines the coordinate transformation: the "parameters by which pixel coordinates are transformed" including transform matrices, bounding boxes, and dimension mappings

This separation provides several benefits:

- **Broader applicability**: Spatial transforms are useful beyond geospatial data (microscopy, medical imaging)
- **Simpler model**: CRS can be defined once at the group level while spatial coordinates vary per array
- **Cleaner conceptual model**: Each convention has a single, well-defined purpose
- **Tool interoperability**: Non-geospatial tools can use spatial coordinates without understanding CRS specifications
- **Modular composition**: Each convention can evolve independently

### Why does the "proj" convention allow inheritance from a group to direct child arrays?

The inheritance model addresses a fundamental pattern in geospatial data organization: multiple arrays (e.g., different bands, variables, or time steps) often share the same coordinate reference system. By defining `proj` at the group level, users can:

1. **Reduce redundancy**: Avoid duplicating identical CRS metadata across multiple arrays
2. **Ensure consistency**: Guarantee that all related arrays use the same projection definition
3. **Simplify management**: Update CRS metadata in one location rather than across many arrays
4. **Match common practice**: Align with how geospatial tools like GDAL organize multi-band rasters and how formats like NetCDF/HDF5 structure data

This pattern is especially valuable for satellite imagery, climate models, and other geospatial datasets where dozens or hundreds of arrays share the same CRS.

### Why does the "proj" convention not support multi-level inheritance (e.g., from a group to grand-child arrays)?

Limiting inheritance to direct children keeps the convention simple and predictable:

1. **Clear scope**: Users can immediately understand which arrays inherit projection metadata by looking at the group's direct children
2. **Avoid ambiguity**: Multi-level inheritance would require complex rules for handling intermediate groups that may or may not define their own projections
3. **Explicit organization**: Zarr hierarchies can be arbitrarily deep; limiting inheritance to one level encourages intentional data organization
4. **Implementation simplicity**: Parsers only need to check one level up, not traverse the entire hierarchy

If nested groups need the same projection, users can either:
- Define `proj` at each group level where needed (e.g. multiscale datasets)
- Restructure their hierarchy to keep related arrays as direct children of a common parent

### Why does the "proj" convention support child arrays overriding parent group CRS definitions?

Array-level overrides provide necessary flexibility for real-world use cases:

1. **Mixed projections**: An array might be reprojected to a different CRS than the group default
2. **Legacy data migration**: When importing data, some arrays might have unique CRS definitions that need preservation
3. **Specialized processing**: Some arrays may require different CRS representations (e.g., using WKT2 instead of EPSG code)

Without override capability, users would be forced to create separate groups for each CRS variation, leading to unnecessarily fragmented hierarchies.

## Acknowledgements

The template is based on the [STAC extensions template](https://github.com/stac-extensions/template/blob/main/README.md).

The convention was copied and modified from
https://github.com/zarr-developers/zarr-extensions/pull/21 and [https://github.com/EOPF-Explorer/data-model/blob/main/attributes/geo/proj/](https://github.com/EOPF-Explorer/data-model/blob/main/attributes/geo/proj/).
