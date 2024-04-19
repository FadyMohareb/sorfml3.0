
# Import libraries
from   dash import Dash, html, Input, Output, callback, dcc # For general Dash modules
import dash_bootstrap_components as dbc                     # For align component
import dash_cytoscape as cyto                               # For network graph with Dash
import json                                                 # For reading and parsing JSON file
import seaborn as sns                                       # For colour palette to colorise nodes

# ----------------------------------------------------------------- #
#                               UTILS                               #
# ----------------------------------------------------------------- #

# Function to update node-hilighting filter condition
# arg is String argument value
# property is target property which is changed
# condition is original condition before chenged
def setFilterCondition( value, target, condition ):
    # Convert None as string
    if value == None: value = 'None'

    # Remove white space, '[' and ']'
    condition_updated = condition
    #condition_updated = condition_updated.replace( ' ', '' )
    condition_updated = condition_updated[ 1 : -1 ]

    # Make it Array with the delimiter ']['
    condition_updated_array = condition_updated.split( '][' )

    # If temperature is decoy(temperature_integer>999999), remove it
    decoy = 'temperature_integer>999999'
    if decoy in condition_updated_array:
        condition_updated_array.remove( decoy )
    print( condition_updated_array )

    # Check if this filter condition already exist
    condition_exist = False
    for element in condition_updated_array:
        if target in element: condition_exist = True

    # Add the new condition
    if condition_exist == False:
        print( target, 'does not exist' )
        if target == 'owner' or target == 'product_name':
            print( '... and target is owner or product name' )
            target_updated = target + '="' + value + '"'
            condition_updated_array.append( target_updated )
        else:
            print( '... and taget is neither owner nor product name' )
            target_updated = target + '>' + value
            condition_updated_array.append( target_updated )

    # Modify the existing condition
    if condition_exist == True:
        print( target, 'does exists' )
        for i in range( len( condition_updated_array ) ):
            if target in condition_updated_array[ i ]:
                if target == 'owner' or target == 'product_name':
                    print( '... and target is owner or product name' )
                    target_updated = target + '="' + value + '"'
                    condition_updated_array[ i ] = target_updated
                    break
                else:
                    print( '... and target is neither owner nor product name' )
                    target_updated = target + '>' + value
                    condition_updated_array[ i ] = target_updated
                    break

    # If an element contains 'None' type, remove it
    for element in condition_updated_array:
        if 'None' in element:
            print( 'None type found:', element )
            condition_updated_array.remove( element )
    print('after removed:', condition_updated_array)
    print( len( condition_updated_array ) )

    # Combine all the elements of array to String again
    result = ''
    if len( condition_updated_array ) == 0:
        result = 'temperature_integer>999999'
    else:
        delimiter = ']['
        result    = delimiter.join( condition_updated_array )

    # Add '[' and ']'
    result = '[' + result + ']'

    print( 'RESULT:' )
    print( result )
    return result

# show content
def showContent( content ):
    print( '\n\nContent:' )
    print( content )

# ----------------------------------------------------------------- #
#                     JSON FILE READING SECTION                     #
# ----------------------------------------------------------------- #

def create_networkgraph_inputdata( json_data ):
    result = json_data

    # Convert 'Weight' and 'Temperature' into integer values
    # They are assigned to newly defined properties 'WeightInteger'
    # and 'TemperatureInteger'.
    for i in range( len( result ) ):
        # Convert string into integer
        object          = result[ i ]
        weight_int      = int( object[ 'Weight' ] )
        temperature_int = int( object[ 'Temperature' ] )
        # Define new properties, 'WeightInteger' and 'TemperatureInteger'
        ( result[ i ] )[ 'WeightInteger' ]      = weight_int
        ( result[ i ] )[ 'TemperatureInteger' ] = temperature_int
    #print(result)

    # After that, 'WeightInteger' values are normalised so that the
    # maxima are 100 and the minima are 30, because
    # these values are used as size of nodes in network graph

    # Note that 'WeightTemperature' values are not actually normalised,
    # just being multiplied by 10 (because they should not relative values!)

    # Get maxima and minima of weight values at the first place
    weight_int_list = [ object[ 'WeightInteger' ] for object in result ]
    #print( weight_int_list )
    weight_int_max  = max( weight_int_list )
    weight_int_min  = min( weight_int_list )

    # So do in temperature values as well
    temperature_int_list = [ object[ 'TemperatureInteger' ] for object in result ]
    #print( temperature_int_list )
    temperature_int_max = max( temperature_int_list )
    temperature_int_min = min( temperature_int_list )

    # Now normalise values - the result values are assigned to
    # newly defined properties 'NodeSizeInWeight' and 'NodeSizeInTemperature'
    for i in range( len( result ) ):
        # Normalise weight
        object     = result[ i ]
        weight_int = object[ 'WeightInteger' ]
        node_size_weight = ( ( weight_int     - weight_int_min ) / \
                             ( weight_int_max - weight_int_min ) ) * 70 + 30
        ( result[ i ] )[ 'NodeSizeInWeight' ] = node_size_weight
        # Normalise temperature as well
        temperature_int       = object[ 'TemperatureInteger' ]
        node_size_temperature = temperature_int * 10
        ( result[ i ] )[ 'NodeSizeInTemperature' ] = node_size_temperature
    #print( result )

    return result

# ----------------------------------------------------------------- #
#                 NODES AND EDGES CREATING SECTION                  #
# ----------------------------------------------------------------- #

# Define nodes from Json data
def get_nodes( json_data ):
    nodes = []
    for object in json_data:
        # Set data object
        data = {
            'id'                    : object[ 'Hash'                  ], # Let's Use hash as the node's unique ID
            'owner'                 : object[ 'Owner'                 ], # Let's Use owner organisation name as label of the node
            'product_name'          : object[ 'ProductName'           ], # Product name
            'product_id'            : object[ 'ProductID'             ], # Product ID
            'weight'                : object[ 'Weight'                ], # Weight
            'weight_integer'        : object[ 'WeightInteger'         ], # Weight as integer
            'temperature'           : object[ 'Temperature'           ], # Temperature as string
            'temperature_integer'   : object[ 'TemperatureInteger'    ], # Temperature as integer
            'location'              : object[ 'Location'              ], # Location
            'timestamp'             : object[ 'EventTimestamp'        ], # Timestamp
            'node_size_weight'      : object[ 'NodeSizeInWeight'      ], # Node size in weight
            'node_size_temperature' : object[ 'NodeSizeInTemperature' ], # Node size in temperature
            'hash'                  : object[ 'Hash'                  ], # Hash (it is same as 'id'. Is it needy???)
            'previous_hash'         : object[ 'PreviousHash'          ], # Previous hash
        }
        nodes.append( { 'data' : data } )

    #print( nodes )
    return nodes

# Colourise nodes based on their information
def set_node_colours( nodes ):
    result = nodes
    # 1.   Add another property named 'colour' to colourise nodes
    # 1-1. Set list of organisation at the first place
    owner_list = [ object[ 'data' ][ 'owner' ] for object in result ]
    owner_list = list( set( owner_list ) )

    # 1-2. Make colour palette using seaborn
    colour_palette = sns.color_palette( 'husl', len( owner_list ) )
    colour_palette = colour_palette.as_hex()
    print( colour_palette )

    # 1-3. Make a dictionary to connect org name and its colour
    label_color_dict = {}
    for i in range( len( owner_list ) ) : label_color_dict[ owner_list[ i ] ] = colour_palette[ i ]
    print( label_color_dict )

    # 1-4. Then, assign all the colour list 
    for object in result:
        # Define color for the organisation
        colour = label_color_dict[ object[ 'data' ][ 'owner' ] ]
        # Append new property 'colour'
        object[ 'data' ][ 'colour_owner' ] = colour

    # 2.   Add another property named 'colour' to colourise nodes
    # 2-1. Set list of organisation at the first place
    product_list = [ object[ 'data' ][ 'product_name' ] for object in result ]
    product_list = list( set( product_list ) )

    # 2-2. Make colour palette using seaborn
    colour_palette = sns.color_palette( 'husl', len( product_list ) )
    colour_palette = colour_palette.as_hex()
    print( colour_palette )

    # 2-3. Make a dictionary to connect org name and its colour
    label_color_dict = {}
    for i in range( len( product_list ) ) : label_color_dict[ product_list[ i ] ] = colour_palette[ i ]
    print( label_color_dict )

    # 2-4. Then, assign all the colour list 
    for object in result:
        # Define color for the organisation
        colour = label_color_dict[ object[ 'data' ][ 'product_name' ] ]
        # Append new property 'colour'
        object[ 'data' ][ 'colour_product' ] = colour

    # 3.   Add another property named 'colour' to colourise nodes
    # 3-1. Set list of organisation at the first place
    location_list = [ object[ 'data' ][ 'location' ] for object in result ]
    location_list = list( set( location_list ) )

    # 3-2. Make colour palette using seaborn
    colour_palette = sns.color_palette( 'husl', len( location_list ) )
    colour_palette = colour_palette.as_hex()
    print( colour_palette )

    # 3-3. Make a dictionary to connect org name and its colour
    label_color_dict = {}
    for i in range( len( location_list ) ) : label_color_dict[ location_list[ i ] ] = colour_palette[ i ]
    print( label_color_dict )

    # 3-4. Then, assign all the colour list 
    for object in result:
        # Define color for the organisation
        colour = label_color_dict[ object[ 'data' ][ 'location' ] ]
        # Append new property 'colour'
        object[ 'data' ][ 'colour_location' ] = colour

    # 4.  Create Owner list for the owner filter
    # 4-1. Define blank array
    owner_dropdown = []

    # 4-2. Create owner dictionary for drop down
    #      Reuse the 'owner_list' variable which was defined in 1-1.
    for owner in owner_list:
        dictionary_owner = { 'label' : owner, 'value' : owner }
        owner_dropdown.append( dictionary_owner )

    # 5.   Create product list for the owner filter
    # 5-1. Define blank array
    product_dropdown = []

    # 5-2. Create owner dictionary for drop down
    #      Reuse the 'product_list' variable which was defined in 1-1.
    for product in product_list:
        dictionary_product = { 'label' : product, 'value' : product }
        product_dropdown.append( dictionary_product )

    #print( result )
    return result

# Define edges from JSON data
def get_edges(json_data):
    edges = []
    for object in json_data:
        if ( object[ 'PreviousHash' ] != 'GenesisBlock' ):    # Ignore Genesis Block edge (or it makes an error!)
            source = object[ 'PreviousHash' ]                 # Start point is previous hash
            target = object[ 'Hash'         ]                 # End point is current hash
            data   = { 'source' : source, 'target' : target } # Set data object
            edges.append( { 'data' : data } )
    #print( edges )

    return edges

# ----------------------------------------------------------------- #
#                      FRONT-END LAYOUT SECTION                     #
# ----------------------------------------------------------------- #

# Define app
#app = Dash( __name__ )

# Set default stylesheet
def set_networkgraph_default_stylesheet():
    network_stylesheet = [
        { # Basic style for nodes
            'selector' : 'node',
            'style'    : {
                'color'              : '#30475E',
                'border-width'       : 3,
                'border-color'       : '#211951',
                'background-color'   : 'data(colour_owner)',
                'label'              : 'data(owner)',
                'font-size'          : '50rem',
                'text-outline-color' : 'white',
                'text-outline-width' : '2px',
                #'text-halign'        : 'center',
                #'text-valign'        : 'center',
                'width'              : 'data(node_size_weight)',
                'height'             : 'data(node_size_weight)'
            }
        },
        { # Basic style for edges
            'selector' : 'edge',
            'style'    : {
                'line-color' : 'gray'
            }
        },
        { # Additional style: Highlight genesis block (root product) with different colour
            'selector' : '[ previous_hash *= "GenesisBlock" ]',
            'style'    : {}
        },
        { # Additional style: if tempetature > n, the nodes are red
            'selector' : '[temperature_integer>999999]', # Dummy!
            'style'    : {
                'border-color'     : 'red',
                'background-color' : '#FF4A4A',
                'shape'            : 'triangle',
                'width'            : '80px',
                'height'           : '80px'
            }
        }
    ]
    #print(network_stylesheet)

    return network_stylesheet

# Set app layout
def set_networkgraph_tab_layout():
    network_tab_styles = {
        # Main networkgraph style
        'networkgraph-plot' : {
            'position' : 'fixed',
            'width'    : '100%',
            'height'   : '100%'
        },
        # Top-left squire block content style
        'block-content' : {
            'position'        : 'fixed',
            'top'             : 0,
            'right'           : '1rem',
            'padding'         : '1rem 1rem',
            'width'           : '20rem',
            'fontSize'        : '14px',
            'color'           : '#647D87',
            'borderStyle'     : 'solid',
            'borderColor'     : '#647D87',
            'background'      : 'rgba(191, 207, 231)',
            #'background'      : 'rgba(191, 207, 231, .5)',
            'borderRadius'    : '10px',
            'overflowX'       : 'scroll'
        },
        # Sidebar menu style
        'sidebar-menu' : {
            'position'        : 'fixed',
            'top'             : 0,
            'left'            : 0,
            'bottom'          : 0,
            'width'           : '16rem',
            'padding'         : '2rem 1rem',
            'background'      : 'rgba(201, 215, 221, .5)'
        },
        # Dropdown title style
        'dropdown-title' : {
            'fontSize'     : '18px',
            'color'        : '#424769',
            'marginTop'    : '18px',
            'marginBottom' : '2px',
            'marginLeft'   : '4px',
        },
        # Dropdown content style
        'dropdown' : {
            'width'           : '200px',
            'backgroundColor' : '#EEEEEE',
            'borderRadius'    : '20px'
        },
        # Number inout box style
        'number-input' : {
            'fontSize'        : '16px',
            'borderStyle'     : 'solid',
            'borderWidth'     : '2px',
            'borderColor'     : '#CFD2CF',
            'backgroundColor' : '#EEEEEE',
            'borderRadius'    : '4px'
        },
        # Network graph reset button note
        'reset-note' : {
            'fontSize'     : '14px',
            'color'        : '#424769',
            'marginTop'    : '18px',
            'marginBottom' : '2px',
            'marginLeft'   : '4px',
        },
        # Network graph reset button style
        'reset-button' : {
            'position'        : 'relative',
            'marginTop'       : '20px',
            'color'           : '#D04848',
            'fontSize'        : '20px',
            'borderStyle'     : 'solid',
            'borderWidth'     : '2px',
            'borderColor'     : '#D04848',
            'backgroundColor' : '#EEEEEE',
            'borderRadius'    : '10px'
        }
    }
    #print(network_tab_styles)

    return network_tab_styles

def get_networkgraph_html_div():
    return html.Div([
        # Main Cytoscape network graph window
        html.Div(
            cyto.Cytoscape(
            id         = 'network-gragh',
            layout     = { 'name' : 'breadthfirst', 'roots' : '[ previous_hash *= "GenesisBlock" ]' },
            elements   = edges + nodes,
            stylesheet = network_stylesheet,
            style      = styles[ 'networkgraph-plot' ]
            )
        ),
        # html.Div for sidebar menu
        html.Div(
            [
                # Network graph style dropdown
                # THIS CODE BLOCK IS NOT USED ANYMORE!!!
                #html.P( 'Graph style', style = styles[ 'dropdown-title' ] ),
                #html.Div(
                #    dcc.Dropdown(
                #        id      = 'networkstyle-dropdown',
                #        options = [
                #            { 'label' : 'Random',       'value' : 'random'       },
                #            { 'label' : 'Grid',         'value' : 'grid'         },
                #            { 'label' : 'Circle',       'value' : 'circle'       },
                #            { 'label' : 'Concentric',   'value' : 'concentric'   },
                #            { 'label' : 'Breadthfirst', 'value' : 'breadthfirst' }
                #        ],
                #        value       = 'breadthfirst',
                #        clearable   = False,
                #        style       = styles[ 'dropdown' ]
                #    )
                #),
                # Node size option dropdown
                html.P( 'Node size', style = styles[ 'dropdown-title' ] ),
                html.Div(
                    dcc.Dropdown(
                        id      = 'nodesize-dropdown',
                        options = [
                            { 'label' : 'Weight',      'value' : 'data(node_size_weight)'      },
                            { 'label' : 'Temperature', 'value' : 'data(node_size_temperature)' }
                        ],
                        value     = 'data(node_size_weight)',
                        clearable = False,
                        style     = styles[ 'dropdown' ]
                    )
                ),
                # Node colour option dropdown
                html.P( 'Node colour', style = styles[ 'dropdown-title' ] ),
                html.Div(
                    dcc.Dropdown(
                        id      = 'nodecolour-dropdown',
                        options = [
                            { 'label' : 'Owner',        'value' : 'data(colour_owner)'    },
                            { 'label' : 'Product name', 'value' : 'data(colour_product)'  },
                            { 'label' : 'Location',     'value' : 'data(colour_location)' }
                        ],
                        value     = 'data(colour_owner)',
                        clearable = False,
                        style     = styles[ 'dropdown' ]
                    )
                ),
                # Temperature threshold highlight. This is number input but
                # the style is the same as dropdown
                html.P( 'Temperature filter', style = styles[ 'dropdown-title' ] ),
                html.Div(
                    dcc.Input(
                        id          = 'filtertemperature-input',
                        type        = 'number',
                        placeholder = 'Temperature / ℃',
                        style       = styles[ 'number-input' ]
                    )
                ),
                # Weight threshold highlight. This is number input but
                # the style is the same as dropdown
                html.P( 'Weight filter', style = styles[ 'dropdown-title' ] ),
                html.Div(
                    dcc.Input(
                        id          = 'filterweight-input',
                        type        = 'number',
                        placeholder = 'Weight / Kg',
                        style       = styles[ 'number-input' ]
                    )
                ),
                # Owner organisation filter dropdown
                html.P( 'Owner filter', style = styles[ 'dropdown-title' ] ),
                html.Div(
                    dcc.Dropdown(
                        id        = 'ownerfilter-dropdown',
                        options   = owner_dropdown,
                        clearable = True,
                        style     = styles[ 'dropdown' ]
                    )
                ),
                # Product name filter dropdown
                html.P( 'Product filter', style = styles[ 'dropdown-title' ] ),
                html.Div(
                    dcc.Dropdown(
                        id        = 'productfilter-dropdown',
                        options   = product_dropdown,
                        clearable = True,
                        style     = styles[ 'dropdown' ]
                    )
                ),
                # Network graph reset button
                html.P(
                    'If the filter does not seem to work, push Reset Filter below and try again.',
                    style = styles[ 'reset-note' ]
                ),
                html.Button(
                    'Reset Filter',
                    id       = 'reset-button',
                    style    = styles[ 'reset-button' ],
                    n_clicks = 0
                )
            ],
            style = styles[ 'sidebar-menu' ]
        ),
        # Show block content in TOP-LEFT box
        html.Pre(
            id       = 'block-content',
            children = 'Block content shows up here.',
            style    = styles[ 'block-content' ]
        )
    ])

''' COMMENT OUT

# ----------------------------------------------------------------- #
#                         CALL-BACK SECTION                         #
# ----------------------------------------------------------------- #

# Callback to display data on the top-right window
@callback( Output( 'block-content', 'children' ), Input( 'network-gragh', 'mouseoverNodeData' ) )
def displayTapNodeData( data ):
    return 'Product Name: '    + data[ 'product_name' ] + '\n' + \
           'Product ID: '      + data[ 'product_id'   ] + '\n' + \
           'Owner: '           + data[ 'owner'        ] + '\n' + \
           'Weight (Kg): '     + data[ 'weight'       ] + '\n' + \
           'Temperature (℃): ' + data[ 'temperature'  ] + '\n' + \
           'Location: '        + data[ 'location'     ] + '\n' + \
           'Timestamp: '       + data[ 'timestamp'    ]

# Callback to change node size from pull down
@callback(
    Output( 'network-gragh', 'stylesheet', allow_duplicate = True ),
    Input( 'nodesize-dropdown', 'value' ),
    prevent_initial_call = True # This is needy to allow duplication of callback output
)
def changeNodeSizePullDown( selected_value ):
    network_stylesheet_updated = network_stylesheet
    network_stylesheet_updated[ 0 ][ 'style' ][ 'width'  ] = selected_value
    network_stylesheet_updated[ 0 ][ 'style' ][ 'height' ] = selected_value
    return network_stylesheet_updated

# Callback to change node colour from pull down
@callback(
    Output( 'network-gragh', 'stylesheet', allow_duplicate = True ),
    Input( 'nodecolour-dropdown', 'value' ),
    prevent_initial_call = True # This is needy to allow duplication of callback output
)
def changeNodeColourPullDown( selected_value ):
    network_stylesheet_updated = network_stylesheet
    network_stylesheet_updated[ 0 ][ 'style' ][ 'background-color'  ] = selected_value

    # Change labels as well
    if   selected_value == 'data(colour_owner)':
        network_stylesheet_updated[ 0 ][ 'style' ][ 'label' ] = 'data(owner)'
    elif selected_value == 'data(colour_product)':
        network_stylesheet_updated[ 0 ][ 'style' ][ 'label' ] = 'data(product_name)'
    elif selected_value == 'data(colour_location)':
        network_stylesheet_updated[ 0 ][ 'style' ][ 'label' ] = 'data(location)'

    return network_stylesheet_updated

# Callback to update temperature highlighting filter
@callback(
    Output( 'network-gragh', 'stylesheet', allow_duplicate = True ),
    Input( 'filtertemperature-input', 'value' ),
    prevent_initial_call = True # This is needy to allow duplication of callback output
)
def setFilterTemperatureInput( input_value ):
    network_stylesheet_updated = network_stylesheet

    # Update temperature condition
    network_stylesheet_updated[ 3 ][ 'selector' ] = setFilterCondition(
        str( input_value ),
        'temperature_integer',
        network_stylesheet_updated[ 3 ][ 'selector' ]
    )

    return network_stylesheet_updated

# Callback to update organisation filter
@callback(
    Output( 'network-gragh', 'stylesheet', allow_duplicate = True ),
    Input( 'ownerfilter-dropdown', 'value' ),
    prevent_initial_call = True # This is needy to allow duplication of callback output
)
def setFilterTemperatureInput( input_value ):
    network_stylesheet_updated = network_stylesheet

    # Update temperature condition
    network_stylesheet_updated[ 3 ][ 'selector' ] = setFilterCondition(
        input_value,
        'owner',
        network_stylesheet_updated[ 3 ][ 'selector' ]
    )

    return network_stylesheet_updated

# Callback to update product name filter
@callback(
    Output( 'network-gragh', 'stylesheet', allow_duplicate = True ),
    Input( 'productfilter-dropdown', 'value' ),
    prevent_initial_call = True # This is needy to allow duplication of callback output
)
def setFilterTemperatureInput( input_value ):
    network_stylesheet_updated = network_stylesheet

    # Update temperature condition
    network_stylesheet_updated[ 3 ][ 'selector' ] = setFilterCondition(
        input_value,
        'product_name',
        network_stylesheet_updated[ 3 ][ 'selector' ]
    )

    return network_stylesheet_updated

# Callback to change node size from pull down
@callback(
    Output( 'network-gragh', 'stylesheet', allow_duplicate = True ),
    Input( 'filterweight-input', 'value' ),
    prevent_initial_call = True # This is needy to allow duplication of callback output
)
def setFilterWeightInput( input_value ):
    network_stylesheet_updated = network_stylesheet

    # Update temperature condition
    network_stylesheet_updated[ 3 ][ 'selector' ] = setFilterCondition(
        str( input_value ),
        'weight_integer',
        network_stylesheet_updated[ 3 ][ 'selector' ]
    )

    return network_stylesheet_updated

# Callback to reset network graph style into default
@callback(
    Output( 'network-gragh', 'stylesheet', allow_duplicate = True ),
    Input( 'reset-button', 'n_clicks' ),
    prevent_initial_call = True # This is needy to allow duplication of callback output
)
def resetNetworkStyleButton( button_n_clicks ):
    if button_n_clicks > 0 :
        network_stylesheet_updated = network_stylesheet
        condition = '[temperature_integer>999999]'
        network_stylesheet_updated[ 3 ][ 'selector' ] = condition
        return network_stylesheet_updated

if __name__ == '__main__':
    app.run( debug = True )
    print( 'It works!' )

''' # COMMENT OUT